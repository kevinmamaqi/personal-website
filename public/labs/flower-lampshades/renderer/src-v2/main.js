// The preview. It imports the same generator the build pipeline uses, so what
// you see here is the mesh that gets written to the STL - not an approximation
// of it. Every shade in the catalogue is a grown surface, so this is a viewer
// for grown surfaces: one code path, one material, full density always.
//
// Full density always, because a grown surface has no draft mode. Its density
// is the resolution of the sheet being simulated, so coarsening it does not
// sample the same shape more roughly - it grows a different one. Tried at
// rings 20 / segments 72 the preview reported a 254mm shade that would not fit
// the bed where the exported STL is 223mm and fits fine. So the sheet is grown
// at full density and the slider is debounced instead.

import { resolveShade } from '../../gen-v2/lib/shade.js';
import { HARDWARE_PARTS, buildBase, buildCollar, buildStem } from '../../gen-v2/lib/parts/hardware.js';
import { decodePreviewCache, previewCacheId } from '../../gen-v2/lib/preview-cache.js';
import { KNUCKLE } from '../../gen-v2/lib/thread.js';
import { meshToStl } from '../../gen-v2/lib/stl.js';
import { SHADES, BY_KEY } from '../../gen-v2/specs/index.js';

import { createViewer, hardwareMaterial, shadeMaterial, toGeometry } from './viewer.js';
import { buildControls, chipGroup, download, downloadUrl, renderReport } from './ui.js';
import * as THREE from 'three';

const query = new URLSearchParams(location.search);
const still = query.has('still');
// `bare` drops the panel: the stage alone, for gallery shots (`make shots`).
if (query.has('bare')) document.body.classList.add('bare');
const viewer = createViewer(document.getElementById('stage'), { still });
const materials = { shade: shadeMaterial(), hardware: hardwareMaterial() };
const topView = document.getElementById('top-view');
const loading = document.getElementById('loading');
const runtime = JSON.parse(document.getElementById('runtime-config').textContent);
const preparedBase = new URL(runtime.cacheBase, location.href);
const stlBase = new URL(runtime.stlBase, location.href);
let resolveInitialBuild;
const initialBuild = new Promise((resolve) => { resolveInitialBuild = resolve; });

function settleInitialBuild() {
  resolveInitialBuild?.();
  resolveInitialBuild = null;
}

function syncQuery() {
  const search = query.toString();
  history.replaceState(null, '', `${location.pathname}${search ? `?${search}` : ''}${location.hash}`);
}

const state = {
  preset: BY_KEY[query.get('shade')] ?? SHADES[0],
  shade: null,
  scale: 1,
  lit: true,
  hardware: true,
};

let currentBuild = null;
let isGrowing = false;

function scaledSpec(spec, scale) {
  if (scale === 1) return spec;
  return { ...spec, silhouette: spec.silhouette.map(([v, r]) => [v, r * scale]) };
}

function renderBuild(built) {
  viewer.clearParts();
  const shadeObject = new THREE.Mesh(toGeometry(built.mesh, built.wall), materials.shade);
  shadeObject.castShadow = true;
  viewer.parts.add(shadeObject);

  let shadeZ = 0;
  if (state.hardware) {
    // Work the stack out from the parts themselves rather than hardcoding it, so
    // changing a thread or a stem length moves everything correctly.
    const engage = KNUCKLE.pitch * KNUCKLE.turns;
    const base = buildBase();
    const stem = buildStem();
    const collar = buildCollar();

    const stemZ = base.height - engage;
    const collarZ = stemZ + stem.length - engage;
    shadeZ = collarZ + collar.seatZ;

    for (const [part, z] of [[base, 0], [stem, stemZ], [collar, collarZ]]) {
      const object = new THREE.Mesh(toGeometry(part.mesh), materials.hardware);
      object.position.z = z;
      object.castShadow = true;
      viewer.parts.add(object);
    }
    // The ring clamps down on top of the shade flange.
    const ring = new THREE.Mesh(toGeometry(HARDWARE_PARTS.ring().mesh), materials.hardware);
    ring.position.z = shadeZ + resolveShade(built.spec).flangeThickness;
    viewer.parts.add(ring);
  }

  shadeObject.position.z = shadeZ;
  viewer.syncShadows([shadeObject]);
  viewer.frame(shadeZ);
  document.title = `${built.name} - Flower lampshades`;
}

function renderGrowth(data) {
  viewer.clearParts();
  const sheet = new THREE.Mesh(toGeometry(data.mesh), materials.shade);
  viewer.parts.add(sheet);
  viewer.syncShadows([]);
  viewer.frame(0);
}

// Growing a sheet takes seconds, so it happens in a module worker while the UI
// remains live. A slider drag still fires on every pixel: debounce until the
// hand stops, invalidate the result immediately, and terminate obsolete work so
// only the newest spec can update the scene or report.
let pendingRebuild = null;
let activeWorker = null;
let activeRequestId = null;
let queuedRequest = null;
let latestBuildId = 0;
const BUILD_CACHE_LIMIT = 12;
const buildCache = new Map();
const preparedFetches = new Map();

function cacheKey(spec) {
  return JSON.stringify(spec);
}

function cachedBuild(spec) {
  const key = cacheKey(spec);
  const built = buildCache.get(key);
  if (!built) return null;

  // Map preserves insertion order. Promote hits so the thirteenth distinct
  // spec evicts the least-recently used result, not merely the oldest result.
  buildCache.delete(key);
  buildCache.set(key, built);
  return built;
}

function cacheBuild(built) {
  const key = cacheKey(built.spec);
  buildCache.delete(key);
  buildCache.set(key, built);
  if (buildCache.size > BUILD_CACHE_LIMIT) {
    buildCache.delete(buildCache.keys().next().value);
  }
}

function showLoading(title, detail, live = false) {
  loading.classList.toggle('live', live);
  loading.querySelector('strong').textContent = title;
  loading.querySelector('small').textContent = detail;
  loading.hidden = false;
}

function showGrowing({ prepared = false } = {}) {
  const report = prepared ? 'loading prepared mesh...' : 'growing the sheet live...';
  document.getElementById('report').innerHTML = `<span class="warn">${report}</span>`;
  document.getElementById('download-shade').disabled = true;
  isGrowing = !prepared;
  if (prepared) {
    loading.hidden = true;
    loading.classList.remove('live');
    if (!currentBuild) {
      showLoading(`Loading ${state.preset.name}`, 'Prepared and validated — no browser growth needed');
    }
  } else {
    viewer.setBulb(false);
    showLoading(`Growing ${state.preset.name} · 0%`, 'Live solver preview — validation follows', true);
  }
}

function showGrowthFrame(data) {
  const percent = Math.round((data.stage / data.stages) * 100);
  renderGrowth(data);
  showLoading(
    `Growing ${state.preset.name} · ${percent}%`,
    `Live elastic sheet · ${data.vertexCount.toLocaleString()} vertices`,
    true
  );
}

function showValidation() {
  document.getElementById('report').innerHTML = '<span class="warn">validating print geometry...</span>';
  showLoading(
    `Validating ${state.preset.name}`,
    'Topology, overhangs, folds and build volume',
    true
  );
}

function showGrowthError(message) {
  const error = document.createElement('span');
  error.className = 'bad';
  error.textContent = `growth failed: ${message}`;
  document.getElementById('report').replaceChildren(error);
  isGrowing = false;
  loading.hidden = true;
  settleInitialBuild();
}

function showBuild(built) {
  currentBuild = { ...built, name: BY_KEY[built.spec.name]?.name ?? built.spec.name };
  isGrowing = false;
  renderReport(document.getElementById('report'), built.analysis, built.manifold);
  document.getElementById('download-shade').disabled = false;
  renderBuild(currentBuild);
  viewer.setBulb(state.lit);
  loading.hidden = true;
  loading.classList.remove('live');
  settleInitialBuild();
  prefetchPreparedDefaults();
}

function preparedFilename(request) {
  return `${request.spec.name}-${previewCacheId(request.spec, request.print)}.bin`;
}

function fetchPrepared(request) {
  const file = preparedFilename(request);
  let pending = preparedFetches.get(file);
  if (!pending) {
    pending = fetch(new URL(file, preparedBase)).then(async (response) => {
      if (!response.ok) throw new Error(`prepared mesh returned ${response.status}`);
      return decodePreviewCache(await response.arrayBuffer());
    }).catch((error) => {
      preparedFetches.delete(file);
      throw error;
    });
    preparedFetches.set(file, pending);
  }
  return pending.then((built) => ({
    ...built,
    spec: request.spec,
    stlUrl: new URL(`${request.spec.name}.stl`, stlBase).href,
  }));
}

let preparedPrefetchStarted = false;
function prefetchPreparedDefaults() {
  if (preparedPrefetchStarted) return;
  preparedPrefetchStarted = true;
  setTimeout(() => {
    for (const preset of SHADES) {
      const spec = { ...structuredClone(preset.shade), name: preset.key };
      if (cachedBuild(spec)) continue;
      const request = { spec, print: structuredClone(preset.print) };
      fetchPrepared(request).then(cacheBuild).catch(() => {});
    }
  }, 0);
}

function showCachedBuild(request) {
  if (request.id !== latestBuildId) return false;
  const built = cachedBuild(request.spec);
  if (!built) return false;
  showBuild(built);
  return true;
}

function postRequest(worker, request) {
  try {
    worker.postMessage(request);
    activeRequestId = request.id;
    return true;
  } catch (error) {
    worker.terminate();
    if (worker === activeWorker) {
      activeWorker = null;
      activeRequestId = null;
    }
    showGrowthError(error instanceof Error ? error.message : String(error));
    return false;
  }
}

function startWorker(request) {
  const workerUrl = new URL('./shade-worker.js', import.meta.url);
  if (still) workerUrl.searchParams.set('request', JSON.stringify(request));
  let worker;
  try {
    worker = new Worker(workerUrl, { type: 'module' });
  } catch (error) {
    showGrowthError(error instanceof Error ? error.message : String(error));
    return;
  }
  activeWorker = worker;
  // In still mode the request is carried on the module URL and starts during
  // evaluation; interactive workers set this again when postRequest succeeds.
  activeRequestId = request.id;

  worker.addEventListener('message', ({ data }) => {
    if (worker !== activeWorker) return;

    // A request can become obsolete while its synchronous simulation is
    // running. Do not terminate that worker from an input handler: Chrome can
    // spend hundreds of milliseconds tearing down its busy isolate. Let it
    // finish off-thread, discard the reply, then send only the newest queued
    // request through the already-loaded module graph.
    if (data.id !== latestBuildId) {
      if (data.type !== 'built' && data.type !== 'error') return;
      if (queuedRequest) {
        const next = queuedRequest;
        queuedRequest = null;
        postRequest(worker, next);
      } else {
        worker.terminate();
        activeWorker = null;
        activeRequestId = null;
      }
      return;
    }

    if (data.type === 'progress') {
      showGrowthFrame(data);
      return;
    }
    if (data.type === 'status') {
      showValidation();
      return;
    }

    worker.terminate();
    activeWorker = null;
    activeRequestId = null;

    if (data.type === 'error') {
      showGrowthError(data.message);
      return;
    }

    // Keep the worker's transferable typed-array result, not a Three geometry.
    // Geometries are cheap view objects and are disposed on every redraw; the
    // deterministic growth simulation is the work worth memoising.
    cacheBuild(data);
    showBuild(data);
  });
  worker.addEventListener('error', (event) => {
    if (worker !== activeWorker) return;
    const failedRequestId = activeRequestId;
    worker.terminate();
    activeWorker = null;
    activeRequestId = null;

    // A browser-level worker error has no request payload to inspect. Gate it
    // with the ID recorded when the request was posted, so a cached latest
    // build cannot be replaced by an obsolete worker's eventual failure.
    if (failedRequestId !== latestBuildId) {
      if (queuedRequest?.id === latestBuildId) {
        const next = queuedRequest;
        queuedRequest = null;
        startWorker(next);
      }
      return;
    }
    if (queuedRequest?.id === latestBuildId) {
      const next = queuedRequest;
      queuedRequest = null;
      startWorker(next);
      return;
    }
    showGrowthError(event.message);
  });
  if (!still) postRequest(worker, request);
}

function buildRequest(id) {
  return {
    id,
    spec: {
      ...scaledSpec(structuredClone(state.shade), state.scale),
      name: state.preset.key,
    },
    print: structuredClone(state.preset.print),
  };
}

function beginRebuild(request) {
  pendingRebuild = null;
  if (request.id !== latestBuildId || showCachedBuild(request)) return;
  if (activeWorker) queuedRequest = request;
  else startWorker(request);
}

function scheduleRebuild() {
  const id = ++latestBuildId;
  clearTimeout(pendingRebuild);
  queuedRequest = null;
  const request = buildRequest(id);
  if (showCachedBuild(request)) return;
  showGrowing();
  pendingRebuild = setTimeout(() => beginRebuild(request), 220);
}

async function loadPreparedNow() {
  const id = ++latestBuildId;
  clearTimeout(pendingRebuild);
  queuedRequest = null;
  const request = buildRequest(id);
  if (showCachedBuild(request)) return;
  showGrowing({ prepared: true });
  try {
    const built = await fetchPrepared(request);
    if (id !== latestBuildId) return;
    cacheBuild(built);
    showBuild(built);
  } catch {
    if (id !== latestBuildId) return;
    showGrowing();
    beginRebuild(request);
  }
}

let refreshSliders = () => {};

function selectPreset(spec) {
  state.preset = spec;
  state.shade = structuredClone(spec.shade);
  state.scale = 1;
  document.getElementById('note').textContent = spec.note;
  refreshSliders = buildControls(
    document.getElementById('controls'),
    document.getElementById('controls-more'),
    state,
    scheduleRebuild
  );
  renderChips();
  loadPreparedNow();
}

function renderChips() {
  chipGroup(
    document.getElementById('catalogue'),
    SHADES.map((s) => ({ ...s, label: s.name })),
    (item) => item.key === state.preset.key,
    (item) => {
      query.set('shade', item.key);
      syncQuery();
      selectPreset(BY_KEY[item.key]);
    }
  );
}

document.getElementById('lit').addEventListener('change', (e) => {
  state.lit = e.target.checked;
  if (currentBuild && !isGrowing) viewer.setBulb(state.lit);
});
document.getElementById('hardware').addEventListener('change', (e) => {
  state.hardware = e.target.checked;
  if (currentBuild && !isGrowing) renderBuild(currentBuild);
});
topView.addEventListener('click', () => {
  const active = topView.getAttribute('aria-pressed') !== 'true';
  topView.setAttribute('aria-pressed', String(active));
  if (active) query.set('view', 'top');
  else query.delete('view');
  syncQuery();
  viewer.setTopView(active);
});
document.getElementById('reset').addEventListener('click', () => selectPreset(state.preset));

document.getElementById('download-shade').addEventListener('click', () => {
  if (!currentBuild) return;
  const filename = `${currentBuild.spec.name}.stl`;
  if (currentBuild.stl) download(currentBuild.stl, filename);
  else if (currentBuild.stlUrl) downloadUrl(currentBuild.stlUrl, filename);
});

document.getElementById('download-hardware').addEventListener('click', () => {
  for (const [name, build] of Object.entries(HARDWARE_PARTS)) {
    download(meshToStl(build().mesh, name), `${name}.stl`);
  }
});

const startsTop = query.get('view') === 'top';
topView.setAttribute('aria-pressed', String(startsTop));
selectPreset(state.preset);
viewer.setTopView(startsTop);
// Headless screenshots wait for module evaluation. Keep the initial module
// pending until the worker result has actually been drawn; virtual time can
// otherwise race through its budget while the worker is still growing.
if (still) await initialBuild;
