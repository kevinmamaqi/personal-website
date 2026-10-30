// Grow and measure a shade away from the UI thread. This imports the generator
// directly: preview/ has no bundle and the worker runs the same plain ES modules
// as the build pipeline.

import { analyseShell } from '../../gen-v2/lib/checks.js';
import { buildShade } from '../../gen-v2/lib/shade.js';
import { previewWall } from '../../gen-v2/lib/preview-cache.js';
import { meshToStl } from '../../gen-v2/lib/stl.js';

function build({ id, spec, print }) {
  try {
    const built = buildShade(spec, {
      onProgress: ({ phase, stage, stages, positions, faces, vertexCount }) => {
        const mesh = {
          positions: Float32Array.from(positions.subarray(0, vertexCount * 3)),
          indices: Uint32Array.from(faces),
        };
        self.postMessage(
          { type: 'progress', id, phase, stage, stages, vertexCount, mesh },
          [mesh.positions.buffer, mesh.indices.buffer]
        );
      },
    });
    self.postMessage({ type: 'status', id, phase: 'validation' });
    const analysis = analyseShell(built, print);
    // Write the download from the generator's original Number positions before
    // toTypedArrays quantises them to Float32 for WebGL transfer. This keeps a
    // preview download byte-identical to the build pipeline's STL.
    const stl = meshToStl(built.mesh, spec.name);
    const mesh = built.mesh.toTypedArrays();
    const wall = previewWall(built);

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
