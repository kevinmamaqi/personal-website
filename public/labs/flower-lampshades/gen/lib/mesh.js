// Triangle-mesh construction. Millimetres, Z up (print orientation: Z is bed normal).
//
// Every part in this project is a radial surface: a radius function r(u, v)
// wrapped around the Z axis. Shades, threads, stems and bases all come out of
// the same two builders below, which is why the whole generator stays small.

import { TAU } from './math.js';

export class Mesh {
  constructor(name = 'part') {
    this.name = name;
    this.positions = []; // flat [x, y, z, ...]
    this.indices = [];   // flat [a, b, c, ...]
  }

  get vertexCount() {
    return this.positions.length / 3;
  }

  get triangleCount() {
    return this.indices.length / 3;
  }

  addVertex(x, y, z) {
    this.positions.push(x, y, z);
    return this.vertexCount - 1;
  }

  addTriangle(a, b, c) {
    this.indices.push(a, b, c);
  }

  /** Append another mesh's geometry, offsetting its indices. */
  merge(other) {
    const offset = this.vertexCount;
    this.positions.push(...other.positions);
    for (const i of other.indices) this.indices.push(i + offset);
    return this;
  }

  translate(dx, dy, dz) {
    for (let i = 0; i < this.positions.length; i += 3) {
      this.positions[i] += dx;
      this.positions[i + 1] += dy;
      this.positions[i + 2] += dz;
    }
    return this;
  }

  bounds() {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < this.positions.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const value = this.positions[i + k];
        if (value < min[k]) min[k] = value;
        if (value > max[k]) max[k] = value;
      }
    }
    return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] };
  }

  toTypedArrays() {
    return {
      positions: new Float32Array(this.positions),
      indices: new Uint32Array(this.indices),
    };
  }
}

/**
 * Wrap a radius field around the Z axis and tessellate it.
 *
 * @param {object} options
 * @param {(u: number, v: number) => number} options.radius  u in [0,1) around, v in [0,1] up
 * @param {(v: number) => number} options.z                  height for a given v
 * @param {number} options.segmentsU  points around the ring
 * @param {number} options.segmentsV  rings up the surface
 * @param {boolean} [options.outward] true if the surface faces away from the axis
 * @returns {{ rings: number[][][], mesh: Mesh }} rings are [v][u] -> [x, y, z]
 */
export function radialSurface({ radius, z, segmentsU, segmentsV, outward = true, name = 'surface' }) {
  const mesh = new Mesh(name);
  const rings = [];

  for (let j = 0; j <= segmentsV; j++) {
    const v = j / segmentsV;
    const zv = z(v);
    const ring = [];
    for (let i = 0; i < segmentsU; i++) {
      const u = i / segmentsU;
      const theta = u * TAU;
      const r = radius(u, v);
      const point = [r * Math.cos(theta), r * Math.sin(theta), zv];
      ring.push(point);
      mesh.addVertex(point[0], point[1], point[2]);
    }
    rings.push(ring);
  }

  for (let j = 0; j < segmentsV; j++) {
    for (let i = 0; i < segmentsU; i++) {
      const iNext = (i + 1) % segmentsU;
      const a = j * segmentsU + i;
      const b = j * segmentsU + iNext;
      const c = (j + 1) * segmentsU + iNext;
      const d = (j + 1) * segmentsU + i;
      if (outward) {
        mesh.addTriangle(a, b, c);
        mesh.addTriangle(a, c, d);
      } else {
        mesh.addTriangle(a, c, b);
        mesh.addTriangle(a, d, c);
      }
    }
  }

  return { rings, mesh };
}

/**
 * Close a ring of vertices with a triangle fan to a centre point.
 * `up` is true when the cap's outward normal points along +Z.
 */
export function capRing(mesh, ringIndices, centre, up) {
  const c = mesh.addVertex(centre[0], centre[1], centre[2]);
  const n = ringIndices.length;
  for (let i = 0; i < n; i++) {
    const a = ringIndices[i];
    const b = ringIndices[(i + 1) % n];
    if (up) mesh.addTriangle(c, a, b);
    else mesh.addTriangle(c, b, a);
  }
}

/** Stitch two concentric rings into a flat annulus. `up` orients the normal. */
export function bridgeRings(mesh, outerIndices, innerIndices, up) {
  const n = outerIndices.length;
  for (let i = 0; i < n; i++) {
    const iNext = (i + 1) % n;
    const o0 = outerIndices[i];
    const o1 = outerIndices[iNext];
    const i0 = innerIndices[i];
    const i1 = innerIndices[iNext];
    if (up) {
      mesh.addTriangle(o0, o1, i1);
      mesh.addTriangle(o0, i1, i0);
    } else {
      mesh.addTriangle(o0, i1, o1);
      mesh.addTriangle(o0, i0, i1);
    }
  }
}

/** Push a ring of points into a mesh and return their indices. */
export function addRing(mesh, ring) {
  return ring.map((p) => mesh.addVertex(p[0], p[1], p[2]));
}

/**
 * A hollow tube: an outer radius field, an inner radius field, and flat annular
 * ends. This is the workhorse for collars, stems and bases.
 */
export function tube({
  outerRadius,
  innerRadius,
  z,
  segmentsU,
  segmentsV,
  name = 'tube',
}) {
  const mesh = new Mesh(name);
  const outerRings = [];
  const innerRings = [];

  for (let j = 0; j <= segmentsV; j++) {
    const v = j / segmentsV;
    const zv = z(v);
    const outer = [];
    const inner = [];
    for (let i = 0; i < segmentsU; i++) {
      const u = i / segmentsU;
      const theta = u * TAU;
      const ro = outerRadius(u, v);
      const ri = innerRadius(u, v);
      outer.push([ro * Math.cos(theta), ro * Math.sin(theta), zv]);
      inner.push([ri * Math.cos(theta), ri * Math.sin(theta), zv]);
    }
    outerRings.push(addRing(mesh, outer));
    innerRings.push(addRing(mesh, inner));
  }

  for (let j = 0; j < segmentsV; j++) {
    for (let i = 0; i < segmentsU; i++) {
      const iNext = (i + 1) % segmentsU;
      // Outer skin faces away from the axis.
      const a = outerRings[j][i];
      const b = outerRings[j][iNext];
      const c = outerRings[j + 1][iNext];
      const d = outerRings[j + 1][i];
      mesh.addTriangle(a, b, c);
      mesh.addTriangle(a, c, d);
      // Bore faces toward the axis, so wind it the other way.
      const e = innerRings[j][i];
      const f = innerRings[j][iNext];
      const g = innerRings[j + 1][iNext];
      const h = innerRings[j + 1][i];
      mesh.addTriangle(e, g, f);
      mesh.addTriangle(e, h, g);
    }
  }

  bridgeRings(mesh, outerRings[0], innerRings[0], false);
  bridgeRings(mesh, outerRings[segmentsV], innerRings[segmentsV], true);

  return { mesh, outerRings, innerRings };
}

/**
 * Edge-manifold check. Every edge of a watertight solid is shared by exactly two
 * triangles, once in each direction. Slicers reject anything else, so this runs
 * in the test suite and in the build.
 */
export function checkManifold(mesh) {
  const edges = new Map();
  const { indices } = mesh;
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    for (let k = 0; k < 3; k++) {
      const a = tri[k];
      const b = tri[(k + 1) % 3];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const dir = a < b ? 1 : -1;
      const entry = edges.get(key) ?? { count: 0, net: 0 };
      entry.count += 1;
      entry.net += dir;
      edges.set(key, entry);
    }
  }
  let boundary = 0;
  let nonManifold = 0;
  let flipped = 0;
  for (const entry of edges.values()) {
    if (entry.count === 1) boundary += 1;
    else if (entry.count > 2) nonManifold += 1;
    else if (entry.net !== 0) flipped += 1;
  }
  return {
    watertight: boundary === 0 && nonManifold === 0 && flipped === 0,
    boundaryEdges: boundary,
    nonManifoldEdges: nonManifold,
    inconsistentEdges: flipped,
    edgeCount: edges.size,
  };
}

/** Signed volume in mm^3 via the divergence theorem. Negative means inverted normals. */
export function signedVolume(mesh) {
  const { positions, indices } = mesh;
  let total = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3;
    const b = indices[t + 1] * 3;
    const c = indices[t + 2] * 3;
    const ax = positions[a], ay = positions[a + 1], az = positions[a + 2];
    const bx = positions[b], by = positions[b + 1], bz = positions[b + 2];
    const cx = positions[c], cy = positions[c + 1], cz = positions[c + 2];
    total +=
      ax * (by * cz - bz * cy) -
      ay * (bx * cz - bz * cx) +
      az * (bx * cy - by * cx);
  }
  return total / 6;
}

/**
 * Stitch an ordered stack of rings into a watertight thin-walled tube.
 *
 * Each row is { z, outer(u), inner(u) }. Two rows may share the same z: that
 * makes a horizontal ledge, which is how the mounting flange gets its step
 * without any boolean operation.
 *
 * The result is open-topped and open-bottomed in the printed sense (there is a
 * hole straight through) but closed as a mesh, which is what slicers require.
 */
export function stitchTube(rows, segmentsU, name = 'shell') {
  // Sample the radius fields into explicit rings and hand them to the general
  // stitcher. Radial parts are the easy case of the same operation.
  return stitchRings(
    rows.map((row) => {
      const outer = [];
      const inner = [];
      for (let i = 0; i < segmentsU; i++) {
        const u = i / segmentsU;
        const theta = u * TAU;
        const ro = row.outer(u);
        const ri = Math.min(row.inner(u), ro - 1e-4);
        outer.push([ro * Math.cos(theta), ro * Math.sin(theta)]);
        inner.push([ri * Math.cos(theta), ri * Math.sin(theta)]);
      }
      return { z: row.z, outer, inner };
    }),
    name
  );
}

/**
 * Stitch an ordered stack of explicit point rings into a watertight thin-walled
 * tube.
 *
 * Each row is { z, outer: [[x, y], ...], inner: [[x, y], ...] }, and every ring
 * must carry the same number of points. This is the general form: the wall of a
 * grown cross-section is a closed curve that no radius field can express, so the
 * points have to be handed over directly rather than sampled from r(u).
 *
 * Two rows may share the same z, which makes a horizontal ledge - that is how
 * the mounting flange gets its step without any boolean operation.
 */
export function stitchRings(rows, name = 'shell') {
  const mesh = new Mesh(name);
  const outerRings = [];
  const innerRings = [];
  const segmentsU = rows[0].outer.length;

  for (const row of rows) {
    if (row.outer.length !== segmentsU || row.inner.length !== segmentsU) {
      throw new Error(`stitchRings: every ring needs ${segmentsU} points`);
    }
    outerRings.push(addRing(mesh, row.outer.map(([x, y]) => [x, y, row.z])));
    innerRings.push(addRing(mesh, row.inner.map(([x, y]) => [x, y, row.z])));
  }

  for (let j = 0; j < rows.length - 1; j++) {
    for (let i = 0; i < segmentsU; i++) {
      const iNext = (i + 1) % segmentsU;
      const a = outerRings[j][i];
      const b = outerRings[j][iNext];
      const c = outerRings[j + 1][iNext];
      const d = outerRings[j + 1][i];
      mesh.addTriangle(a, b, c);
      mesh.addTriangle(a, c, d);
      const e = innerRings[j][i];
      const f = innerRings[j][iNext];
      const g = innerRings[j + 1][iNext];
      const h = innerRings[j + 1][i];
      mesh.addTriangle(e, g, f);
      mesh.addTriangle(e, h, g);
    }
  }

  // Bottom annulus faces down, top annulus faces up.
  bridgeRings(mesh, outerRings[0], innerRings[0], false);
  bridgeRings(mesh, outerRings[rows.length - 1], innerRings[rows.length - 1], true);

  return { mesh, outerRings, innerRings };
}
