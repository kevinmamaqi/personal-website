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

import { resolveShade } from '../../gen/lib/shade.js';
import { HARDWARE_PARTS, buildBase, buildCollar, buildStem } from '../../gen/lib/parts/hardware.js';
import { KNUCKLE } from '../../gen/lib/thread.js';
import { meshToStl } from '../../gen/lib/stl.js';
import { SHADES, BY_KEY } from '../../gen/specs/index.js';

import { createViewer, hardwareMaterial, shadeMaterial, toGeometry } from './viewer.js';
import { buildControls, chipGroup, download, renderReport } from './ui.js';
import * as THREE from 'three';

const query = new URLSearchParams(location.search);
const still = query.has('still');
// `bare` drops the panel: the stage alone, for gallery shots (`make shots`).
if (query.has('bare')) document.body.classList.add('bare');
const viewer = createViewer(document.getElementById('stage'), { still });
const materials = { shade: shadeMaterial(), hardware: hardwareMaterial() };
const topView = document.getElementById('top-view');
const loading = document.getElementById('loading');
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

function showGrowing() {
  document.getElementById('report').innerHTML = '<span class="warn">growing the sheet...</span>';
  document.getElementById('download-shade').disabled = true;
  if (!currentBuild) {
    loading.querySelector('strong').textContent = `Growing ${state.preset.name}`;
    loading.hidden = false;
  }
}

function showGrowthError(message) {
  const error = document.createElement('span');
  error.className = 'bad';
  error.textContent = `growth failed: ${message}`;
  document.getElementById('report').replaceChildren(error);
  loading.hidden = true;
  settleInitialBuild();
}

function showBuild(built) {
  currentBuild = { ...built, name: BY_KEY[built.spec.name]?.name ?? built.spec.name };
  renderReport(document.getElementById('report'), built.analysis, built.manifold);
  document.getElementById('download-shade').disabled = false;
  renderBuild(currentBuild);
  viewer.setBulb(state.lit);
  loading.hidden = true;
  settleInitialBuild();
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

function rebuildNow() {
  const id = ++latestBuildId;
  clearTimeout(pendingRebuild);
  queuedRequest = null;
  const request = buildRequest(id);
  if (showCachedBuild(request)) return;
  showGrowing();
  beginRebuild(request);
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
  rebuildNow();
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
  if (currentBuild) viewer.setBulb(state.lit);
});
document.getElementById('hardware').addEventListener('change', (e) => {
  state.hardware = e.target.checked;
  if (currentBuild) renderBuild(currentBuild);
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
  download(currentBuild.stl, `${currentBuild.spec.name}.stl`);
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
