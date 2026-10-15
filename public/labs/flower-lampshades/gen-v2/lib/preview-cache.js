// Compact, browser-readable snapshots of fully built and validated default
// shades. The defaults are generated on the build machine once; the browser
// only decodes typed arrays and creates a Three.js geometry.

const MAGIC = 0x3148534c; // "LSH1" in little-endian order
const VERSION = 1;
const HEADER_BYTES = 24;

const aligned4 = (n) => (n + 3) & ~3;

/** A stable filename suffix derived from exactly what the worker would build. */
export function previewCacheId(spec, print) {
  const source = JSON.stringify({ version: VERSION, spec, print });
  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Per-vertex wall values used by the translucent preview material. */
export function previewWall(built) {
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

export function encodePreviewCache({ mesh, wall, analysis, manifold }) {
  const metadata = new TextEncoder().encode(JSON.stringify({
    analysis,
    manifold,
    wall: { min: wall.min, max: wall.max },
  }));
  const dataOffset = aligned4(HEADER_BYTES + metadata.length);
  const byteLength = dataOffset
    + mesh.positions.byteLength
    + mesh.indices.byteLength
    + wall.thickness.byteLength;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint32(0, MAGIC, true);
  view.setUint32(4, VERSION, true);
  view.setUint32(8, metadata.length, true);
  view.setUint32(12, mesh.positions.length, true);
  view.setUint32(16, mesh.indices.length, true);
  view.setUint32(20, wall.thickness.length, true);
  bytes.set(metadata, HEADER_BYTES);

  let offset = dataOffset;
  new Float32Array(buffer, offset, mesh.positions.length).set(mesh.positions);
  offset += mesh.positions.byteLength;
  new Uint32Array(buffer, offset, mesh.indices.length).set(mesh.indices);
  offset += mesh.indices.byteLength;
  new Float32Array(buffer, offset, wall.thickness.length).set(wall.thickness);
  return buffer;
}

export function decodePreviewCache(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < HEADER_BYTES || view.getUint32(0, true) !== MAGIC) {
    throw new Error('Not a flower-lampshade preview cache');
  }
  if (view.getUint32(4, true) !== VERSION) {
    throw new Error('Unsupported flower-lampshade preview cache version');
  }

  const metadataLength = view.getUint32(8, true);
  const positionsLength = view.getUint32(12, true);
  const indicesLength = view.getUint32(16, true);
  const thicknessLength = view.getUint32(20, true);
  const dataOffset = aligned4(HEADER_BYTES + metadataLength);
  const expected = dataOffset
    + positionsLength * Float32Array.BYTES_PER_ELEMENT
    + indicesLength * Uint32Array.BYTES_PER_ELEMENT
    + thicknessLength * Float32Array.BYTES_PER_ELEMENT;
  if (expected !== buffer.byteLength) throw new Error('Truncated flower-lampshade preview cache');

  const metadata = JSON.parse(new TextDecoder().decode(
    new Uint8Array(buffer, HEADER_BYTES, metadataLength)
  ));
  let offset = dataOffset;
  const positions = new Float32Array(buffer, offset, positionsLength);
  offset += positions.byteLength;
  const indices = new Uint32Array(buffer, offset, indicesLength);
  offset += indices.byteLength;
  const thickness = new Float32Array(buffer, offset, thicknessLength);

  return {
    mesh: { positions, indices },
    wall: { ...metadata.wall, thickness },
    analysis: metadata.analysis,
    manifold: metadata.manifold,
  };
}
