// Grow and measure a shade away from the UI thread. This imports the generator
// directly: preview/ has no bundle and the worker runs the same plain ES modules
// as the build pipeline.

import { analyseShell } from '../../gen/lib/checks.js';
import { buildShade } from '../../gen/lib/shade.js';
import { meshToStl } from '../../gen/lib/stl.js';

/**
 * The wall thickness at every mesh vertex, read from the paired outer and inner
 * sheet vertices. The band and flange vertices that follow use the nominal wall.
 */
function wallThickness(built) {
  const { mesh, shell } = built;
  const n = shell.vertexCount;
  const p = mesh.positions;
  const thickness = new Float32Array(mesh.vertexCount).fill(shell.spec.wallThickness);
  for (let i = 0; i < n; i++) {
    const a = i * 3;
    const b = (i + n) * 3;
    thickness[i] = thickness[i + n] = Math.hypot(
      p[b] - p[a],
      p[b + 1] - p[a + 1],
      p[b + 2] - p[a + 2]
    );
  }
  const surface = shell.spec.surface;
  const wall = shell.spec.wallThickness;
  return {
    thickness,
    min: wall * (1 - surface.wallTaper),
    max: wall * (1 + (surface.veins ? surface.veinRelief : 0)),
  };
}

function build({ id, spec, print }) {
  try {
    const built = buildShade(spec);
    const analysis = analyseShell(built, print);
    // Write the download from the generator's original Number positions before
    // toTypedArrays quantises them to Float32 for WebGL transfer. This keeps a
    // preview download byte-identical to the build pipeline's STL.
    const stl = meshToStl(built.mesh, spec.name);
    const mesh = built.mesh.toTypedArrays();
    const wall = wallThickness(built);

    self.postMessage(
      { type: 'built', id, spec, mesh, wall, stl, analysis, manifold: built.manifold },
      [mesh.positions.buffer, mesh.indices.buffer, wall.thickness.buffer, stl]
    );
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

self.addEventListener('message', ({ data }) => build(data));

// Chrome's screenshot CLI advances virtual time without waiting for work that
// starts after a module worker has loaded. For `?still`, carrying the first
// request on the worker-module URL starts growth during module evaluation, so
// the pending module load holds virtual time until the transferable result is
// ready. Interactive builds use the ordinary message protocol above.
const initial = new URL(import.meta.url).searchParams.get('request');
if (initial) build(JSON.parse(initial));
