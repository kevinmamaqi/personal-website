// The catalogue. One file per flower; add a file, list it here, and it appears
// in the build, the preview and the docs. Nothing else needs to change.

import datura from './datura.js';
import morningglory from './morningglory.js';
import lily from './lily.js';
import camellia from './camellia.js';
import poppy from './poppy.js';

// Grown surfaces only. Every shade here is an elastic sheet that was given
// more area than it could hold flat and left to find its own shape; the
// drawn families the generator also supports live on as test fixtures.
export const SHADES = [datura, camellia, lily, morningglory, poppy];
export const BY_KEY = Object.fromEntries(SHADES.map((s) => [s.key, s]));
export default SHADES;
