// Binary STL writer. Returns an ArrayBuffer, so the same code serves the Node
// build and the preview's download button.

export function meshToStl(mesh, header = 'lampshades') {
  const { positions, indices } = mesh;
  const triangles = indices.length / 3;
  const buffer = new ArrayBuffer(84 + triangles * 50);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const title = header.slice(0, 79);
  for (let i = 0; i < title.length; i++) bytes[i] = title.charCodeAt(i) & 0x7f;
  view.setUint32(80, triangles, true);

  let offset = 84;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3;
    const b = indices[t + 1] * 3;
    const c = indices[t + 2] * 3;

    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;
    for (const i of [a, b, c]) {
      view.setFloat32(offset, positions[i], true);
      view.setFloat32(offset + 4, positions[i + 1], true);
      view.setFloat32(offset + 8, positions[i + 2], true);
      offset += 12;
    }
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}
