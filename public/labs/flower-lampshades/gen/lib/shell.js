// Differential growth of an elastic surface.
//
// The curve version in growth.js grows a 1-manifold - a closed loop - and the
// shade is a stack of them. That is a tube however much the loop wobbles: every
// layer is still one circuit around the axis, so the result is a cylinder with
// modulation, which is exactly what it looks like.
//
// A petal is not a tube. It is a *sheet* whose margin has been given more area
// than the surrounding space can hold flat, and which buckles out of plane to
// store the surplus. Growing a 2-manifold is the difference, and it is what
// Nervous System's Floraform does.
//
// The physics is Discrete Shells (Grinspun, Hirani, Desbrun, Schroeder, 2003):
//
//   stretch   every edge is a spring on its rest length
//   bend      every interior edge is a hinge, with energy in the angle between
//             the two faces it joins, measured against a *rest* angle taken
//             from the seed surface - so a cone stays a cone until it is grown
//   collide   vertices repel, or the sheet folds through itself
//
// Growth is applied to the edge REST LENGTHS, not to the positions. Nothing
// pushes the surface into a ruffle; the rest state simply stops being one the
// sheet can reach in the plane, and buckling is the relief. That is the whole
// idea, and it is why the result looks grown rather than modelled.
//
// Mesh operations follow Cabbage (arXiv 2504.18040): growth is driven by edge
// subdivision, so resolution follows the surplus length instead of being fixed
// up front.

import { TAU, clamp, monotoneSpline, smoothstep } from './math.js';
import { rng } from './growth.js';
import { Mesh, addRing, bridgeRings, checkManifold } from './mesh.js';

export const SHELL_DEFAULTS = {
  rings: 26,            // subdivisions up the seed surface
  segments: 96,         // subdivisions around it
  stages: 26,           // growth increments
  growPerStage: 0.05,   // rest-length gain per stage at the free margin
  growthOnset: 0.45,    // where along the surface growth starts, 0 throat 1 rim
  iterations: 22,       // dynamic steps between growth increments
  passes: 6,            // constraint projection sweeps inside one dynamic step
  damping: 0.9,         // 0..1, how much of a step's motion carries to the next
  collideEvery: 8,      // rebuild the collision candidate list this often
  stretch: 1.0,         // 0..1, how hard an edge insists on its rest length
  bend: 0.32,           // 0..1, how hard a hinge resists leaving its rest shape
  repulsion: 0.6,       // 0..1
  repelDistance: 3.2,   // mm; below this two bits of sheet push apart
  lift: 0,              // mm per stage of upward bias on the growing margin
  petals: 0,            // lobes around the margin; 0 grows one continuous ruffle
  petalContrast: 0.6,   // 0..1, how much less the sinuses between petals grow than the petals
  petalReach: 0,        // extra meridional growth at the petal centres, as a multiple of growPerStage
  anisotropy: 0,        // 0..1, how much of the growth is circumferential only
  curl: 0,              // 1/mm of rest curvature the margin acquires across the run; positive reflexes it outward
  petalShape: 1,        // exponent on the lobe profile: >1 narrows the petals and widens the sinuses, <1 the reverse
  petalTwist: 0,        // radians the lobe centres drift around the axis per unit of height, so the petals spiral
  veins: 0,             // radial ribs of stiffer sheet; 0 for a uniform sheet
  veinStiffness: 3,     // how much stiffer a rib is than the sheet between ribs
  noise: 0,             // 0..1, seeded patchiness in the growth field, so no two petals grow alike
  slits: 0,             // meridional cuts from the margin down, between the petals, so each has free edges
  slitDepth: 0.3,       // how far down the sheet a slit reaches, as a fraction of its height
  slitRoot: 2,          // rings over which a slit opens from its root to full width, so the sinus is rounded not notched
  wallTaper: 0,         // 0..1, how much thinner the wall is at the margin than at the throat
  veinRelief: 0,        // how much thicker the wall is along a vein, as a fraction of the wall
  splitAbove: 1.6,      // split an edge whose rest length exceeds this * target
  maxVertices: 30000,   // hard stop, so a runaway parameter set cannot hang a build
  seed: 1,
  jitter: 0.35,         // mm of out-of-plane noise, to break the axisymmetry
};

const sub = (p, a, b) => [p[a] - p[b], p[a + 1] - p[b + 1], p[a + 2] - p[b + 2]];
const norm = (u) => Math.hypot(u[0], u[1], u[2]);

/**
 * Seed surface: the trumpet the shade would have been, as an open annulus.
 *
 * Growth needs somewhere to start, and starting from the intended lamp keeps
 * the throat, the silhouette and the proportions under the designer's control.
 * All the simulation adds is what the formula could not: a margin that buckles.
 */
export function seedTrumpet({
  silhouette, height, throatHeight = 0, rings, segments, baseZ = 0, inset = 0, throatRadius,
  slits = 0, slitDepth = 0.3, slitGap = 3.2, slitRoot = 2, petals = 0,
}) {
  const profile = monotoneSpline(silhouette);
  const positions = [];
  const growth = [];   // 0 at the throat, 1 at the free margin
  const pinned = [];
  const throatFraction = clamp(throatHeight / height, 0, 0.9);
  const radiusAt = (v) => (v <= throatFraction
    ? (throatRadius ?? profile(0))
    : profile((v - throatFraction) / (1 - throatFraction))) - inset;

  // Slits: a cut from the margin partway down the sheet, one per sinus, so
  // that each petal has free edges of its own and can curl independently. A
  // cut is a column of vertices that exists twice, once for the faces on
  // each side, from the ring the slit starts at up to the margin; the ring
  // below that is the root and is shared. The two copies are seeded a
  // repulsion radius apart rather than on top of each other: coincident
  // vertices give the collision term no direction to push in, and the first
  // thing that separated them - the out-of-plane jitter - would have had it
  // fling them apart vertically, which is a torn seam rather than a slit.
  const slitColumns = new Map(); // column -> angular half-gap
  if (slits > 0) {
    for (let k = 0; k < slits; k++) {
      // Between the petals, if there are petals to be between.
      const at = petals ? ((k + 0.5) / slits) * segments : (k / slits) * segments;
      slitColumns.set(Math.round(at) % segments, k);
    }
  }
  const slitStart = slits > 0 ? Math.max(1, Math.ceil(rings * (1 - slitDepth))) : Infinity;
  // A cut that opens to full width on its first ring is a notch; a real sinus
  // is rounded. The gap widens over `slitRoot` rings above the shared root.
  const gapAt = (j) => slitGap * Math.min(1, (j - slitStart + 1) / Math.max(1, slitRoot));

  for (let j = 0; j <= rings; j++) {
    const v = j / rings;
    // The straight throat first, then the flare, matching the radial shades.
    // `inset` pulls the sheet in by half a wall, because what is simulated is
    // the mid-surface: offsetting it outward by the same half wall later puts
    // the finished outer face back on the silhouette the designer drew.
    const r = radiusAt(v);
    for (let i = 0; i < segments; i++) {
      let theta = (i / segments) * TAU;
      // The left copy of a slit column sits half a gap to one side.
      if (j >= slitStart && slitColumns.has(i)) theta -= gapAt(j) / 2 / r;
      positions.push(Math.cos(theta) * r, Math.sin(theta) * r, baseZ + v * height);
      growth.push(v);
      pinned.push(j === 0 ? 1 : 0);
    }
  }
  // The right copies, appended after the grid so that every grid index - the
  // throat ring, the rim ring the tests read - keeps its meaning.
  const rightCopy = new Map(); // j * segments + i -> duplicate index
  for (const [i] of slitColumns) {
    for (let j = slitStart; j <= rings; j++) {
      const v = j / rings;
      const r = radiusAt(v);
      const theta = (i / segments) * TAU + gapAt(j) / 2 / r;
      rightCopy.set(j * segments + i, positions.length / 3);
      positions.push(Math.cos(theta) * r, Math.sin(theta) * r, baseZ + v * height);
      growth.push(v);
      pinned.push(0);
    }
  }
  // A quad between columns i and i+1 sees column i from its right side and
  // column i+1 from its left; only the right side of a cut column is the copy.
  const at = (j, i, fromRight) => {
    const id = j * segments + i;
    return fromRight && j >= slitStart && slitColumns.has(i) ? rightCopy.get(id) : id;
  };

  const faces = [];
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const iNext = (i + 1) % segments;
      const a = at(j, i, true);
      const b = at(j, iNext, false);
      const c = at(j + 1, iNext, false);
      const d = at(j + 1, i, true);
      faces.push(a, b, c);
      faces.push(a, c, d);
    }
  }

  return { positions, faces, growth, pinned, segments, slitStart: slits > 0 ? slitStart : null };
}

/** Edge key, order-independent. */
const key = (a, b) => (a < b ? a * 4294967296 + b : b * 4294967296 + a);

/**
 * Build hinge records: for every edge, its two endpoints and its opposite
 * corners. `wings[0]` is always the corner of the face that walks the edge from
 * `a` to `b`, so that a hinge's dihedral angle has a sign the whole mesh agrees
 * on - see `hingeAngle`.
 */
function buildEdges(faces) {
  const map = new Map();
  for (let f = 0; f < faces.length; f += 3) {
    const tri = [faces[f], faces[f + 1], faces[f + 2]];
    for (let k = 0; k < 3; k++) {
      const a = tri[k];
      const b = tri[(k + 1) % 3];
      const opposite = tri[(k + 2) % 3];
      const id = key(a, b);
      let entry = map.get(id);
      if (!entry) map.set(id, (entry = { a: Math.min(a, b), b: Math.max(a, b), wings: [] }));
      // The mesh is consistently oriented, so of the two faces on an edge
      // exactly one walks it low-to-high; that one's corner goes first.
      if (a === entry.a) entry.wings.unshift(opposite);
      else entry.wings.push(opposite);
    }
  }
  return [...map.values()];
}

/**
 * Grow the seed surface.
 *
 * @returns {{ positions: Float64Array, faces: number[], vertexCount: number, residual: number }}
 */
export function growShell(seed, options = {}) {
  const o = { ...SHELL_DEFAULTS, ...options };
  const random = rng(o.seed);

  let positions = Float64Array.from(seed.restPositions ?? seed.positions);
  // Material coordinates: where each vertex sat on the seed, kept for the life
  // of the run and interpolated for every vertex subdivision adds. Once the
  // sheet folds, the spatial direction of an edge says nothing about whether
  // it runs around the trumpet or up it, and the growth field needs both that
  // and the angle around the axis. Storing the seed position rather than the
  // angle itself is what makes the wrap at theta = 0 a non-issue: the midpoint
  // of a chord across the seam is still on the right side of the axis.
  let reference = Float64Array.from(positions);
  let faces = [...seed.faces];
  let growth = [...seed.growth];
  let pinned = [...seed.pinned];
  let count = growth.length;

  let edges = buildEdges(faces);
  const restLength = new Map();
  const restAngle = new Map();
  const bonded = new Set();

  const edgeLength = (e) => norm(sub(positions, e.a * 3, e.b * 3));

  /**
   * Signed dihedral angle at a hinge: 0 when flat, positive when the two
   * corners fold toward the surface's outward normal, i.e. when the outside of
   * the sheet is concave across this edge. Bridson, Marino & Fedkiw 2003,
   * with the sign chosen so the gradient below is the gradient of this angle.
   *
   * The first version was the unsigned acos of the two normals, which reads a
   * fold toward the axis and a fold away from it as the same angle. That was
   * tolerable while every rest angle came from the seed and sat within a
   * couple of degrees of flat, and it becomes unusable the moment the rest
   * angle is meant to *move*: an unsigned constraint cannot say which way, and
   * its gradient vanishes at flat, which is exactly where a petal that is
   * being asked to curl starts from.
   */
  const hingeAngle = (e) => {
    const a = e.a * 3, b = e.b * 3, c = e.wings[0] * 3, d = e.wings[1] * 3;
    const ex = positions[b] - positions[a], ey = positions[b + 1] - positions[a + 1], ez = positions[b + 2] - positions[a + 2];
    // N1 = (w3 - a) x (w3 - b), N2 = (w4 - b) x (w4 - a): both point the same
    // way when the hinge is flat.
    const px = positions[c] - positions[a], py = positions[c + 1] - positions[a + 1], pz = positions[c + 2] - positions[a + 2];
    const qx = positions[c] - positions[b], qy = positions[c + 1] - positions[b + 1], qz = positions[c + 2] - positions[b + 2];
    const rx = positions[d] - positions[b], ry = positions[d + 1] - positions[b + 1], rz = positions[d + 2] - positions[b + 2];
    const sx = positions[d] - positions[a], sy = positions[d + 1] - positions[a + 1], sz = positions[d + 2] - positions[a + 2];
    const n1x = py * qz - pz * qy, n1y = pz * qx - px * qz, n1z = px * qy - py * qx;
    const n2x = ry * sz - rz * sy, n2y = rz * sx - rx * sz, n2z = rx * sy - ry * sx;
    const l1 = Math.hypot(n1x, n1y, n1z), l2 = Math.hypot(n2x, n2y, n2z), le = Math.hypot(ex, ey, ez);
    if (l1 < 1e-12 || l2 < 1e-12 || le < 1e-12) return null;
    const cx = n2y * n1z - n2z * n1y, cy = n2z * n1x - n2x * n1z, cz = n2x * n1y - n2y * n1x;
    const sine = (cx * ex + cy * ey + cz * ez) / (l1 * l2 * le);
    const cosine = (n1x * n2x + n1y * n2y + n1z * n2z) / (l1 * l2);
    return Math.atan2(sine, cosine);
  };

  // Any edge or hinge without a remembered rest state takes it from the current
  // shape. On the seed that captures the designed cone; after a subdivision it
  // captures whatever the sheet already is, so refining the mesh does not itself
  // bend the surface.
  /**
   * Material angle and height of an edge's midpoint, and how circumferential
   * the edge is, all read off the seed - see `reference`.
   */
  const material = (e) => {
    const ax = reference[e.a * 3], ay = reference[e.a * 3 + 1];
    const bx = reference[e.b * 3], by = reference[e.b * 3 + 1];
    const mx = ax + bx, my = ay + by;
    const dx = bx - ax, dy = by - ay, dz = reference[e.b * 3 + 2] - reference[e.a * 3 + 2];
    const len2 = dx * dx + dy * dy + dz * dz;
    const rl = Math.hypot(mx, my) || 1;
    const along = (-my * dx + mx * dy) / rl;
    return {
      theta: Math.atan2(my, mx),
      v: (growth[e.a] + growth[e.b]) / 2,
      c2: len2 > 0 ? clamp((along * along) / len2, 0, 1) : 0,
    };
  };

  /**
   * Veins: radial ribs of stiffer sheet. A petal is not a uniform membrane -
   * it has ribs, and its folds anchor between them - so a hinge near a rib
   * bends harder than one between ribs. The rib profile is a narrow bump
   * around each of `veins` meridians; the stiffness is clamped to 1 because
   * that is as hard as a projected constraint can be.
   */
  const ribAt = (theta, v) => Math.pow((1 + Math.cos(o.veins * (theta - o.petalTwist * v))) / 2, 4);
  const bendStiffness = (e) => {
    if (!o.veins) return o.bend;
    const { theta, v } = material(e);
    const rib = ribAt(theta, v);
    return clamp(o.bend * (1 + o.veinStiffness * rib), 0, 1);
  };

  const rememberRest = () => {
    for (const e of edges) {
      const id = key(e.a, e.b);
      if (!restLength.has(id)) restLength.set(id, edgeLength(e));
      if (e.wings.length === 2 && !restAngle.has(id)) {
        const phi = hingeAngle(e);
        if (phi !== null) restAngle.set(id, phi);
      }
      e.bend = bendStiffness(e);
    }
    bonded.clear();
    for (const e of edges) {
      bonded.add(key(e.a, e.b));
      if (e.wings.length === 2) bonded.add(key(e.wings[0], e.wings[1]));
    }
  };
  rememberRest();

  // Only now break the axial symmetry, and only in the positions - the rest
  // state stays the clean seed. Perturbing before the rest state is captured
  // bakes the noise into it, so the sheet is already at equilibrium and the
  // perturbation exerts no restoring force at all: it stops being a nudge and
  // becomes a slightly bumpy target.
  if (seed.restPositions) positions = Float64Array.from(seed.positions);
  for (let i = 0; i < count; i++) {
    if (pinned[i]) continue;
    positions[i * 3 + 2] += (random() - 0.5) * 2 * o.jitter * growth[i];
  }

  // Position-based dynamics: project constraints directly instead of
  // integrating forces.
  //
  // The first version integrated forces explicitly with a step clamp, and it
  // never once converged: every vertex sat on the clamp every step at every
  // stiffness tried, from stretch 0.02 to bend 40. Saturated like that, each
  // vertex just moves the maximum distance in whatever direction it is pushed,
  // so the sheet crumples at the finest wavelength the mesh allows - foil
  // texture, not a ruffle. Projection is unconditionally stable for any
  // stiffness in [0, 1] and has no timestep to get wrong.
  //
  let velocity = new Float64Array(positions.length);

  // Collision candidates, found on a hash grid and reused for a few sweeps. The
  // sheet moves a small fraction of a cell per sweep, so rebuilding the grid
  // every sweep costs most of the runtime and buys nothing; the cell is a whole
  // repulsion radius wide and the search covers the 27 neighbouring cells, so a
  // pair a few sweeps stale is still found well before the two bits touch.
  let collisionPairs = [];
  const findCollisions = () => {
    collisionPairs.length = 0;
    if (o.repulsion <= 0) return;
    const cell = o.repelDistance;
    const grid = new Map();
    // An integer key rather than a template string: this is the hot loop, and
    // building millions of strings dominated the profile.
    const gridKey = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
    for (let i = 0; i < count; i++) {
      const gk = gridKey(
        Math.floor(positions[i * 3] / cell),
        Math.floor(positions[i * 3 + 1] / cell),
        Math.floor(positions[i * 3 + 2] / cell)
      );
      let bucket = grid.get(gk);
      if (!bucket) grid.set(gk, (bucket = []));
      bucket.push(i);
    }
    for (let i = 0; i < count; i++) {
      const cx = Math.floor(positions[i * 3] / cell);
      const cy = Math.floor(positions[i * 3 + 1] / cell);
      const cz = Math.floor(positions[i * 3 + 2] / cell);
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          for (let gz = cz - 1; gz <= cz + 1; gz++) {
            const bucket = grid.get(gridKey(gx, gy, gz));
            if (!bucket) continue;
            for (const j of bucket) {
              if (j <= i) continue;
              if (bonded.has(key(i, j))) continue; // a constraint already holds these
              collisionPairs.push(i, j);
            }
          }
        }
      }
    }
  };

  const pair = (i, j, rest, stiffness) => {
    const dx = positions[j * 3] - positions[i * 3];
    const dy = positions[j * 3 + 1] - positions[i * 3 + 1];
    const dz = positions[j * 3 + 2] - positions[i * 3 + 2];
    const len = Math.hypot(dx, dy, dz) || 1e-12;
    const error = len - rest;
    const wi = pinned[i] ? 0 : 1;
    const wj = pinned[j] ? 0 : 1;
    const total = wi + wj;
    if (total === 0) return 0;
    const scale = (stiffness * error) / len / total;
    if (wi) {
      positions[i * 3] += dx * scale;
      positions[i * 3 + 1] += dy * scale;
      positions[i * 3 + 2] += dz * scale;
    }
    if (wj) {
      positions[j * 3] -= dx * scale;
      positions[j * 3 + 1] -= dy * scale;
      positions[j * 3 + 2] -= dz * scale;
    }
    return Math.abs(error);
  };

  /**
   * Bending, as the hinge's signed dihedral angle against its rest angle,
   * projected as a position-based constraint with the angle's gradient from
   * Bridson, Marino & Fedkiw 2003. Written out in scalars because it is the
   * hot loop: a hinge is visited some tens of millions of times over a run,
   * and the readable vector-helper version spent most of the runtime in the
   * allocator.
   *
   * The first version made bending a distance constraint between the two
   * vertices opposite the hinge, which is the easy formulation and is wrong
   * here: that distance is a function of the five edge lengths as well as the
   * angle, so the constraint pulls directly against the edge constraints and
   * neither ever wins. Measured, it left a 5.4mm stretch error on a 6mm mesh
   * and inflated the surface 16% past the area its own rest lengths allowed -
   * the bending constraint was manufacturing area. The dihedral angle is
   * invariant to the edge lengths, so the two constraint sets are compatible
   * and the same run settles to 0.2mm.
   *
   * The second version used the unsigned angle (Mueller et al. 2007, section
   * 5.5), whose projection carries a factor of sin(angle) and so cannot move a
   * flat hinge at all. This gradient has no such factor: at flat it is simply
   * the two face normals, scaled by the edge, which is what lets a rest angle
   * that has been moved away from flat actually curl the sheet.
   */
  const bend = () => {
    for (const e of edges) {
      if (e.wings.length !== 2) continue;
      const rest = restAngle.get(key(e.a, e.b));
      if (rest === undefined) continue;
      const i1 = e.a, i2 = e.b, i3 = e.wings[0], i4 = e.wings[1];
      const w1 = pinned[i1] ? 0 : 1;
      const w2 = pinned[i2] ? 0 : 1;
      const w3 = pinned[i3] ? 0 : 1;
      const w4 = pinned[i4] ? 0 : 1;
      if (w1 + w2 + w3 + w4 === 0) continue;

      const a = i1 * 3, b = i2 * 3, c = i3 * 3, d = i4 * 3;
      const ex = positions[b] - positions[a], ey = positions[b + 1] - positions[a + 1], ez = positions[b + 2] - positions[a + 2];
      const px = positions[c] - positions[a], py = positions[c + 1] - positions[a + 1], pz = positions[c + 2] - positions[a + 2];
      const qx = positions[c] - positions[b], qy = positions[c + 1] - positions[b + 1], qz = positions[c + 2] - positions[b + 2];
      const rx = positions[d] - positions[b], ry = positions[d + 1] - positions[b + 1], rz = positions[d + 2] - positions[b + 2];
      const sx = positions[d] - positions[a], sy = positions[d + 1] - positions[a + 1], sz = positions[d + 2] - positions[a + 2];
      const n1x = py * qz - pz * qy, n1y = pz * qx - px * qz, n1z = px * qy - py * qx;
      const n2x = ry * sz - rz * sy, n2y = rz * sx - rx * sz, n2z = rx * sy - ry * sx;
      const l1 = n1x * n1x + n1y * n1y + n1z * n1z;
      const l2 = n2x * n2x + n2y * n2y + n2z * n2z;
      const le2 = ex * ex + ey * ey + ez * ez;
      if (l1 < 1e-18 || l2 < 1e-18 || le2 < 1e-18) continue; // a degenerate triangle has no plane
      const le = Math.sqrt(le2);
      const L1 = Math.sqrt(l1), L2 = Math.sqrt(l2);

      const cx = n2y * n1z - n2z * n1y, cy = n2z * n1x - n2x * n1z, cz = n2x * n1y - n2y * n1x;
      const sine = (cx * ex + cy * ey + cz * ez) / (L1 * L2 * le);
      const cosine = (n1x * n2x + n1y * n2y + n1z * n2z) / (L1 * L2);
      const error = Math.atan2(sine, cosine) - rest;
      if (error > -1e-7 && error < 1e-7) continue;

      // Gradient of the angle: the corners move along their face normals, the
      // edge ends by whatever keeps the four of them summing to zero.
      const g1 = le / l1, g2 = le / l2;
      const u3x = n1x * g1, u3y = n1y * g1, u3z = n1z * g1;
      const u4x = n2x * g2, u4y = n2y * g2, u4z = n2z * g2;
      const kq = (qx * ex + qy * ey + qz * ez) / le / l1;   // (w3 - b) . e_hat / |N1|^2
      const kr = (rx * ex + ry * ey + rz * ez) / le / l2;   // (w4 - b) . e_hat / |N2|^2
      const kp = (px * ex + py * ey + pz * ez) / le / l1;   // (w3 - a) . e_hat / |N1|^2
      const ks = (sx * ex + sy * ey + sz * ez) / le / l2;   // (w4 - a) . e_hat / |N2|^2
      const u1x = kq * n1x + kr * n2x, u1y = kq * n1y + kr * n2y, u1z = kq * n1z + kr * n2z;
      const u2x = -kp * n1x - ks * n2x, u2y = -kp * n1y - ks * n2y, u2z = -kp * n1z - ks * n2z;

      const denom = w1 * (u1x * u1x + u1y * u1y + u1z * u1z)
                  + w2 * (u2x * u2x + u2y * u2y + u2z * u2z)
                  + w3 * (u3x * u3x + u3y * u3y + u3z * u3z)
                  + w4 * (u4x * u4x + u4y * u4y + u4z * u4z);
      if (denom < 1e-12) continue;
      const lambda = (-e.bend * error) / denom;

      if (w1) { positions[a] += lambda * u1x; positions[a + 1] += lambda * u1y; positions[a + 2] += lambda * u1z; }
      if (w2) { positions[b] += lambda * u2x; positions[b + 1] += lambda * u2y; positions[b + 2] += lambda * u2z; }
      if (w3) { positions[c] += lambda * u3x; positions[c + 1] += lambda * u3y; positions[c + 2] += lambda * u3z; }
      if (w4) { positions[d] += lambda * u4x; positions[d + 1] += lambda * u4y; positions[d + 2] += lambda * u4z; }
    }
  };

  /**
   * One Gauss-Seidel sweep. Returns the worst *stretch* error, which is the
   * only constraint that has to end up satisfied: a hinge at equilibrium is
   * meant to be violated - that violation is the stored bending energy, and the
   * whole ruffle is made of it - so folding bending into a convergence number
   * makes the number mean nothing.
   */
  let strainSum = 0;
  const project = () => {
    let worst = 0;
    strainSum = 0;
    for (const e of edges) {
      const rest = restLength.get(key(e.a, e.b));
      const err = pair(e.a, e.b, rest, o.stretch);
      strainSum += err / rest;
      if (err > worst) worst = err;
    }
    if (o.bend > 0) bend();
    // Collide: without this the sheet folds straight through itself, and a
    // ruffle is exactly the situation where it tries to. One-sided - two
    // vertices further apart than the radius are left alone.
    for (let k = 0; k < collisionPairs.length; k += 2) {
      const i = collisionPairs[k];
      const j = collisionPairs[k + 1];
      const dx = positions[j * 3] - positions[i * 3];
      const dy = positions[j * 3 + 1] - positions[i * 3 + 1];
      const dz = positions[j * 3 + 2] - positions[i * 3 + 2];
      if (dx * dx + dy * dy + dz * dz >= o.repelDistance * o.repelDistance) continue;
      pair(i, j, o.repelDistance, o.repulsion);
    }
    return worst;
  };

  /**
   * One dynamic step: carry the previous step's motion forward, project, then
   * read the new velocity back off the positions.
   *
   * Projection on its own is a Gauss-Seidel smoother. It kills short-wavelength
   * error in a handful of sweeps and long-wavelength error only by diffusing it
   * one edge per sweep, so a pure-projection run converges to the crumple long
   * before it finds the ruffle - measured, it went 24 lobes at 4 sweeps to 7 at
   * 120, still drifting at 400. Momentum is what makes the low modes grow
   * instead of diffuse: a buckle that starts moving keeps moving, and the
   * long-wavelength one wins because it meets the least resistance.
   */
  const step = () => {
    const previous = Float64Array.from(positions);
    for (let i = 0; i < count; i++) {
      if (pinned[i]) continue;
      for (let k = 0; k < 3; k++) positions[i * 3 + k] += velocity[i * 3 + k];
    }
    let worst = 0;
    for (let k = 0; k < o.passes; k++) worst = project();
    for (let i = 0; i < positions.length; i++) {
      velocity[i] = (positions[i] - previous[i]) * o.damping;
    }
    return worst;
  };

  // Edge subdivision: resolution follows the surplus length rather than being
  // fixed up front, which is what lets the ruffle keep sub-dividing as it grows.
  //
  // The test is against a fixed target spacing, not against the edge's own rest
  // length. Growth lengthens the rest state and the edge follows it, so
  // "longer than my rest length" is never true and the mesh would never refine
  // however much area was added.
  const targetEdge = (() => {
    let total = 0;
    for (const e of edges) total += edgeLength(e);
    return total / edges.length;
  })();

  const subdivide = () => {
    const longest = [];
    for (const e of edges) {
      // The throat ring is never refined. It is the seam the mounting flange is
      // stitched to, and that stitch is exact only while the ring is still the
      // seed's own polygon, in the seed's own vertex order.
      if (pinned[e.a] && pinned[e.b]) continue;
      if (restLength.get(key(e.a, e.b)) > o.splitAbove * targetEdge) longest.push(e);
    }
    if (!longest.length) return false;

    const midpointOf = new Map();
    const newPositions = [...positions];
    const newReference = [...reference];
    for (const e of longest) {
      if (count >= o.maxVertices) break;
      const id = key(e.a, e.b);
      const m = count;
      for (let k = 0; k < 3; k++) newPositions.push((positions[e.a * 3 + k] + positions[e.b * 3 + k]) / 2);
      for (let k = 0; k < 3; k++) newReference.push((reference[e.a * 3 + k] + reference[e.b * 3 + k]) / 2);
      growth.push((growth[e.a] + growth[e.b]) / 2);
      pinned.push(pinned[e.a] && pinned[e.b] ? 1 : 0);
      midpointOf.set(id, m);
      count += 1;
      restLength.set(key(e.a, m), restLength.get(id) / 2);
      restLength.set(key(m, e.b), restLength.get(id) / 2);
      // The two halves of a hinge are the same hinge: they keep its rest
      // angle, the way they keep half its rest length. Letting them read a
      // fresh rest angle off the current shape instead - which is what every
      // hinge subdivision *creates* does, correctly, since those are flat by
      // construction - would bake the sheet's current bend into its memory at
      // every refinement, and any rest curvature the run had accumulated on
      // the parent would be silently forgotten in exactly the band that is
      // being refined.
      const angle = restAngle.get(id);
      if (angle !== undefined) {
        restAngle.set(key(e.a, m), angle);
        restAngle.set(key(m, e.b), angle);
      }
    }
    if (!midpointOf.size) return false;

    const out = [];
    for (let f = 0; f < faces.length; f += 3) {
      const tri = [faces[f], faces[f + 1], faces[f + 2]];
      const mids = tri.map((_, k) => midpointOf.get(key(tri[k], tri[(k + 1) % 3])) ?? -1);
      const split = mids.filter((m) => m >= 0).length;
      if (split === 0) { out.push(...tri); continue; }
      if (split === 3) {
        out.push(tri[0], mids[0], mids[2], mids[0], tri[1], mids[1], mids[2], mids[1], tri[2], mids[0], mids[1], mids[2]);
        continue;
      }
      if (split === 1) {
        const k = mids.findIndex((m) => m >= 0);
        out.push(tri[k], mids[k], tri[(k + 2) % 3], mids[k], tri[(k + 1) % 3], tri[(k + 2) % 3]);
        continue;
      }
      // Two split edges: cut the corner they share, then the remaining quad.
      const k = mids.findIndex((m, i) => m >= 0 && mids[(i + 1) % 3] >= 0);
      const k2 = (k + 1) % 3;
      out.push(mids[k], tri[k2], mids[k2], mids[k], mids[k2], tri[(k2 + 1) % 3], mids[k], tri[(k2 + 1) % 3], tri[k]);
    }

    positions = Float64Array.from(newPositions);
    reference = Float64Array.from(newReference);
    // The velocity buffer has to grow with the mesh. Leaving it at the old size
    // means every vertex added by subdivision reads undefined out of it, which
    // becomes NaN on the next step and collapses the whole sheet onto the
    // pinned ring - silently, because a typed array ignores the write back.
    const grown = new Float64Array(positions.length);
    grown.set(velocity);
    velocity = grown;
    faces = out;
    edges = buildEdges(faces);
    rememberRest();
    return true;
  };

  /**
   * How much one edge's rest length grows this stage.
   *
   * Growth is a change to the sheet's metric, and a metric has a direction. The
   * plain version is isotropic - every edge past the onset grows by the same
   * factor - and a cone can absorb any amount of that by opening its angle,
   * which is why so much of the early tuning went into forcing it to buckle
   * anyway. Three refinements, each off by default:
   *
   * - `petals`: the growth field is periodic around the axis, `petals` lobes of
   *   full growth separated by sinuses that grow `petalContrast` less. The
   *   margin bulges where it grows and stays put where it does not, which is
   *   the difference between one continuous frill and a ring of lobes.
   * - `anisotropy`: the circumferential part of the growth is kept and the
   *   meridional part is scaled down. Surplus circumference with no extra
   *   slant length cannot be relieved by flaring - the distance from the
   *   throat is fixed - so the sheet has to pleat radially, like a paper fan.
   * - `petalReach`: extra meridional growth at the petal centres only, so the
   *   petals grow longer than the sinuses and the margin scallops.
   *
   * The direction of an edge is measured on the seed, not on the grown sheet,
   * and the factor is the length of the edge's direction vector under the
   * grown metric: an edge at angle c to the circumferential direction ends up
   * sqrt((1 - c^2) lr^2 + c^2 lt^2) times longer for growth lr along the
   * meridian and lt around it, which reduces to lt exactly when everything is
   * isotropic.
   */
  /**
   * Patchy growth. The clean field makes every petal identical, and the eye
   * reads identical as manufactured. This is a smooth, seeded value-noise
   * field over the material coordinates - a coarse grid of random values,
   * periodic around the axis, blended with smoothstep - in [-1, 1]. Its own
   * random stream, so switching it on does not disturb the jitter and a
   * shade with `noise: 0` is bit-for-bit what it was.
   */
  const NOISE_U = 7, NOISE_V = 3;
  let noiseGrid = null;
  const noiseAt = (theta, v) => {
    if (!noiseGrid) {
      const draw = rng((o.seed * 7919 + 17) >>> 0);
      noiseGrid = Float64Array.from({ length: NOISE_U * (NOISE_V + 1) }, () => draw() * 2 - 1);
    }
    const u = ((theta / TAU) % 1 + 1) % 1 * NOISE_U;
    const w = clamp(v, 0, 1) * NOISE_V;
    const u0 = Math.floor(u), w0 = Math.min(Math.floor(w), NOISE_V - 1);
    const fu = smoothstep(u - u0), fw = smoothstep(w - w0);
    const g = (iu, iw) => noiseGrid[iw * NOISE_U + (iu % NOISE_U)];
    return (g(u0, w0) * (1 - fu) + g(u0 + 1, w0) * fu) * (1 - fw)
         + (g(u0, w0 + 1) * (1 - fu) + g(u0 + 1, w0 + 1) * fu) * fw;
  };

  const growthFactor = (e) => {
    const w = smoothstep((((growth[e.a] + growth[e.b]) / 2) - o.growthOnset) / (1 - o.growthOnset));
    if (w <= 0) return 1;
    let g = o.growPerStage * w;
    if (!o.petals && !o.anisotropy && !o.petalReach && !o.noise) return 1 + g;

    const { theta, v, c2 } = material(e);
    if (o.noise) g *= 1 + o.noise * noiseAt(theta, v);
    // The lobe centres drift around the axis with height when the petals
    // are asked to spiral.
    const phase = o.petals ? o.petals * (theta - o.petalTwist * v) : 0;
    const lobe = o.petals ? Math.pow((1 + Math.cos(phase)) / 2, o.petalShape) : 1;
    const mix = o.petals ? 1 - o.petalContrast * (1 - lobe) : 1;

    const lt = 1 + g * mix;
    const lr = 1 + g * (mix * (1 - o.anisotropy) + o.petalReach * lobe);
    return Math.sqrt((1 - c2) * lr * lr + c2 * lt * lt);
  };

  let residual = 0;
  for (let stage = 0; stage < o.stages; stage++) {
    // Growth: the rest lengths get longer, the positions do not. Nothing pushes
    // the sheet into a ruffle - the flat state simply stops being reachable.
    for (const e of edges) {
      const id = key(e.a, e.b);
      const factor = growthFactor(e);
      if (factor === 1) continue;
      restLength.set(id, restLength.get(id) * factor);
      // Only the lengths. The rest angle is deliberately left alone: growth is
      // a change to the surface's metric, bending memory is angular, and the
      // two are independent. A patch that doubles in area still wants to be
      // just as flat as it was.
    }

    // Rest curvature, which is the other thing a growing petal does. Tissue
    // that grows faster on one face than the other does not just want more
    // area, it wants to be *curved*, and a lily's or a cyclamen's reflexed
    // petal is that and nothing else. This moves the rest angle of the hinges
    // in the growing band by the angle a curvature of `curl` would put across
    // each of them, weighted toward the hinges that run around the axis -
    // bending across those is what curls the margin back, bending across the
    // meridional ones would only tighten the trumpet. Positive is outward.
    if (o.curl !== 0) {
      for (const e of edges) {
        if (e.wings.length !== 2) continue;
        const id = key(e.a, e.b);
        const rest = restAngle.get(id);
        if (rest === undefined) continue;
        const w = smoothstep((((growth[e.a] + growth[e.b]) / 2) - o.growthOnset) / (1 - o.growthOnset));
        if (w <= 0) continue;
        const { c2 } = material(e);
        if (c2 <= 0) continue;
        // The span the hinge bends across, on the seed: corner to corner.
        const c = e.wings[0] * 3, d = e.wings[1] * 3;
        const span = Math.hypot(reference[c] - reference[d], reference[c + 1] - reference[d + 1], reference[c + 2] - reference[d + 2]);
        restAngle.set(id, rest + (o.curl / o.stages) * w * c2 * span);
      }
    }

    // Phototropism, and the reason it earns its place in a lampshade generator.
    //
    // Buckling is symmetric: a sheet with surplus length is equally happy
    // folding up or down, so half of every ruffle ends up as down-facing
    // surface, which is the one thing an FDM printer cannot make. Real flowers
    // are not symmetric about this - they grow toward light - and biasing the
    // margin upward by a fraction of a millimetre per stage is enough to pick
    // the upward branch nearly everywhere. The fold that results is a vertical
    // pleat rather than a drooping frill: the same shape, the same depth, and a
    // surface whose normals point sideways instead of down.
    //
    // It is a nudge, not a shaping force. The relaxation that follows is free
    // to overrule it, and where the sheet genuinely wants to fold down it still
    // does - which is what keeps the rim from looking combed.
    if (o.lift !== 0) {
      for (let i = 0; i < count; i++) {
        if (pinned[i]) continue;
        const w = smoothstep((growth[i] - o.growthOnset) / (1 - o.growthOnset));
        if (w <= 0) continue;
        positions[i * 3 + 2] += o.lift * w;
      }
    }
    for (let k = 0; k < o.iterations; k++) {
      if (k % o.collideEvery === 0) findCollisions();
      residual = step();
    }
    if (count < o.maxVertices) subdivide();
  }
  // Settle: let the momentum bleed off so the returned shape is an equilibrium
  // and not a snapshot of something still moving. Without this the mesh carries
  // whatever wave was crossing it at the last stage, and that reads on the
  // print as overhang the design does not actually have.
  velocity.fill(0);
  for (let k = 0; k < o.iterations * 2; k++) {
    if (k % o.collideEvery === 0) findCollisions();
    residual = project();
  }

  return {
    positions,
    faces,
    vertexCount: count,
    residual,
    strain: strainSum / edges.length,
    growth,
    pinned,
    reference,
  };
}

/**
 * Area-weighted vertex normals.
 *
 * Area-weighted rather than uniform because the mesh is deliberately uneven -
 * subdivision refines only where growth put the surplus - and an unweighted
 * average would let a cluster of small triangles outvote the large one they sit
 * next to, which tilts the offset direction exactly where the ruffle is
 * tightest and the offset can least afford it.
 */
export function vertexNormals(positions, faces, count) {
  const normals = new Float64Array(count * 3);
  for (let f = 0; f < faces.length; f += 3) {
    const a = faces[f] * 3, b = faces[f + 1] * 3, c = faces[f + 2] * 3;
    const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    // Not normalised: the cross product's length is twice the triangle's area,
    // which is the weight we want.
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const i of [faces[f], faces[f + 1], faces[f + 2]]) {
      normals[i * 3] += nx;
      normals[i * 3 + 1] += ny;
      normals[i * 3 + 2] += nz;
    }
  }
  for (let i = 0; i < count; i++) {
    const len = Math.hypot(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]) || 1;
    normals[i * 3] /= len;
    normals[i * 3 + 1] /= len;
    normals[i * 3 + 2] /= len;
  }
  return normals;
}

/** Directed edges that appear in exactly one face: the free margin and the throat. */
function boundaryEdges(faces) {
  const seen = new Set();
  for (let f = 0; f < faces.length; f += 3) {
    const t = [faces[f], faces[f + 1], faces[f + 2]];
    for (let k = 0; k < 3; k++) seen.add(t[k] * 4294967296 + t[(k + 1) % 3]);
  }
  const out = [];
  for (let f = 0; f < faces.length; f += 3) {
    const t = [faces[f], faces[f + 1], faces[f + 2]];
    for (let k = 0; k < 3; k++) {
      const a = t[k], b = t[(k + 1) % 3];
      if (!seen.has(b * 4294967296 + a)) out.push(a, b);
    }
  }
  return out;
}

/**
 * Closest approach between two bits of sheet that are not neighbours.
 *
 * This is the number that decides whether the shape can be given a wall at all.
 * A ruffle folds back on itself, and once two faces are closer than the wall
 * thickness their offsets pass through each other: the STL is still watertight,
 * so nothing downstream complains, and the slicer prints a knot.
 *
 * "Not neighbours" has to be measured along the surface, not by index and not
 * by hop count. Excluding everything within k hops reports the k-hop spacing of
 * the mesh instead of the tightness of any fold - every variant came back with
 * the same 10.94mm, which was the four-hop spacing at the unrefined throat and
 * had nothing to do with the ruffles. So a pair counts as a fold only when the
 * walk between the two points along the surface is at least `foldRatio` times
 * the straight line between them: on one smooth sheet those two lengths are
 * nearly equal however coarse the triangles are, and across a fold the walk has
 * to go all the way out to the crease and back.
 *
 * Gaps wider than `guard` are not searched for, and come back as Infinity with
 * no pair. Returning the pair lets the printability check compare the gap with
 * the wall thickness at the fold rather than with a global nominal thickness.
 *
 * @returns {{ gap: number, pair: [number, number] | null }}
 */
export function minSheetGap(positions, faces, count, { guard = 6, foldRatio = 8 } = {}) {
  const neighbours = Array.from({ length: count }, () => []);
  const linked = new Set();
  const link = (a, b) => {
    const id = key(a, b);
    if (linked.has(id)) return;
    linked.add(id);
    const d = Math.hypot(
      positions[b * 3] - positions[a * 3],
      positions[b * 3 + 1] - positions[a * 3 + 1],
      positions[b * 3 + 2] - positions[a * 3 + 2]
    );
    neighbours[a].push([b, d]);
    neighbours[b].push([a, d]);
  };
  for (let f = 0; f < faces.length; f += 3) {
    link(faces[f], faces[f + 1]);
    link(faces[f + 1], faces[f + 2]);
    link(faces[f + 2], faces[f]);
  }

  // Candidates first, on a hash grid, so the expensive walk runs only for the
  // handful of vertices that have anything near them at all.
  const cell = guard;
  const grid = new Map();
  const gridKey = (x, y, z) => ((x + 4096) * 8192 + (y + 4096)) * 8192 + (z + 4096);
  for (let i = 0; i < count; i++) {
    const gk = gridKey(
      Math.floor(positions[i * 3] / cell),
      Math.floor(positions[i * 3 + 1] / cell),
      Math.floor(positions[i * 3 + 2] / cell)
    );
    let bucket = grid.get(gk);
    if (!bucket) grid.set(gk, (bucket = []));
    bucket.push(i);
  }

  const candidates = new Map();
  for (let i = 0; i < count; i++) {
    const cx = Math.floor(positions[i * 3] / cell);
    const cy = Math.floor(positions[i * 3 + 1] / cell);
    const cz = Math.floor(positions[i * 3 + 2] / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        for (let gz = cz - 1; gz <= cz + 1; gz++) {
          for (const j of grid.get(gridKey(gx, gy, gz)) ?? []) {
            if (j <= i) continue;
            const d = Math.hypot(
              positions[j * 3] - positions[i * 3],
              positions[j * 3 + 1] - positions[i * 3 + 1],
              positions[j * 3 + 2] - positions[i * 3 + 2]
            );
            if (d >= guard) continue;
            if (!candidates.has(i)) candidates.set(i, []);
            candidates.get(i).push([j, d]);
          }
        }
      }
    }
  }

  let best = Infinity;
  let pair = null;
  for (const [i, list] of candidates) {
    let horizon = 0;
    for (const [, d] of list) if (d * foldRatio > horizon) horizon = d * foldRatio;
    const reach = walkFrom(neighbours, i, horizon);
    for (const [j, d] of list) {
      if (d >= best) continue;
      const along = reach.get(j);
      if (along !== undefined && along < d * foldRatio) continue; // same sheet
      best = d;
      pair = [i, j];
    }
  }
  return { gap: best, pair };
}

/** Dijkstra from one vertex, stopping at `horizon` of accumulated edge length. */
function walkFrom(neighbours, start, horizon) {
  const dist = new Map([[start, 0]]);
  // A linear-scan frontier rather than a heap: the horizon keeps this to a few
  // dozen vertices, where the constant factor beats the data structure.
  const frontier = [[start, 0]];
  while (frontier.length) {
    let pick = 0;
    for (let k = 1; k < frontier.length; k++) if (frontier[k][1] < frontier[pick][1]) pick = k;
    const [v, d] = frontier.splice(pick, 1)[0];
    if (d > (dist.get(v) ?? Infinity)) continue;
    for (const [w, len] of neighbours[v]) {
      const next = d + len;
      if (next > horizon || next >= (dist.get(w) ?? Infinity)) continue;
      dist.set(w, next);
      frontier.push([w, next]);
    }
  }
  return dist;
}

/**
 * Grow a shade and give it a wall.
 *
 * The simulation produces a surface with no thickness. Turning that into
 * something a printer can make means offsetting it half a wall each way along
 * the vertex normals and closing the two sheets along the free margin. The
 * throat is the exception: its ring is forced back onto an exact circle so the
 * mounting flange can be stitched straight onto it.
 *
 * @param {object} s  a resolved shade spec, with s.surface holding SHELL_DEFAULTS
 * @returns {{ mesh, manifold, shell }}
 */
export function buildShellShade(s) {
  const t = s.wallThickness;
  const half = t / 2;
  const segments = s.surface.segments;
  const baseZ = s.flangeThickness;

  const seed = seedTrumpet({
    silhouette: s.silhouette,
    height: s.height - baseZ,
    throatHeight: s.throatHeight,
    throatRadius: s.throatRadius,
    rings: s.surface.rings,
    segments,
    baseZ,
    inset: half,
    slits: s.surface.slits,
    slitDepth: s.surface.slitDepth,
    slitGap: s.surface.repelDistance,
    slitRoot: s.surface.slitRoot,
    petals: s.surface.petals,
  });
  const grown = growShell(seed, s.surface);
  const { positions, faces, vertexCount, reference, growth } = grown;
  const normals = vertexNormals(positions, faces, vertexCount);

  // The wall need not be one thickness. Tapering it toward the margin is what a
  // petal does and is what makes the margin glow; thickening it along the
  // veins is how a backlit petal shows its ribs, as darker lines. Both are
  // functions of the material coordinates, and both fade to nothing at the
  // throat so the flange seam is untouched.
  const o = s.surface;
  const thicknessAt = (i) => {
    const v = growth[i];
    let scale = 1 - o.wallTaper * v;
    if (o.veins && o.veinRelief) {
      const theta = Math.atan2(reference[i * 3 + 1], reference[i * 3]);
      const rib = Math.pow((1 + Math.cos(o.veins * (theta - o.petalTwist * v))) / 2, 4);
      scale += o.veinRelief * rib * Math.min(1, v * 4);
    }
    return t * scale;
  };

  // The throat ring is seed vertices 0..segments-1, in angular order, and
  // subdivision is forbidden from touching it. Its normal is forced exactly
  // radial so the two offset rings come out as true circles: the flange is a
  // circle, and a seam between a circle and a nearly-circle is a seam.
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * TAU;
    normals[i * 3] = Math.cos(theta);
    normals[i * 3 + 1] = Math.sin(theta);
    normals[i * 3 + 2] = 0;
  }

  const mesh = new Mesh(s.name ?? 'shade');
  // Outer sheet first, then inner, so index i maps to outer i and inner i+n.
  const halfAt = new Float64Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) halfAt[i] = thicknessAt(i) / 2;
  for (let i = 0; i < vertexCount; i++) {
    mesh.addVertex(
      positions[i * 3] + normals[i * 3] * halfAt[i],
      positions[i * 3 + 1] + normals[i * 3 + 1] * halfAt[i],
      positions[i * 3 + 2] + normals[i * 3 + 2] * halfAt[i]
    );
  }
  for (let i = 0; i < vertexCount; i++) {
    mesh.addVertex(
      positions[i * 3] - normals[i * 3] * halfAt[i],
      positions[i * 3 + 1] - normals[i * 3 + 1] * halfAt[i],
      positions[i * 3 + 2] - normals[i * 3 + 2] * halfAt[i]
    );
  }
  const inner = (i) => i + vertexCount;

  for (let f = 0; f < faces.length; f += 3) {
    mesh.addTriangle(faces[f], faces[f + 1], faces[f + 2]);
    // Reversed: the inner sheet's outward normal points into the cavity.
    mesh.addTriangle(inner(faces[f + 2]), inner(faces[f + 1]), inner(faces[f]));
  }

  // Close the free margin with a band one wall wide. Working from directed
  // boundary edges rather than from an ordered loop means the rim needs no
  // traversal at all, and the winding comes out right by construction: for a
  // half-edge a->b the solid is on its left, so the band runs outer-a, inner-a,
  // inner-b, outer-b.
  const edges = boundaryEdges(faces);
  let throatEdges = 0;
  for (let k = 0; k < edges.length; k += 2) {
    const a = edges[k];
    const b = edges[k + 1];
    if (a < segments && b < segments) { throatEdges += 1; continue; } // the throat, capped by the flange
    mesh.addTriangle(a, inner(a), inner(b));
    mesh.addTriangle(a, inner(b), b);
  }
  if (throatEdges !== segments) {
    throw new Error(`buildShellShade: throat ring has ${throatEdges} edges, expected ${segments}`);
  }

  // The mounting flange: a flat solid annulus from the bore out to the throat,
  // with a ledge on the inside where it becomes a single wall. Its top outer
  // edge is the shell's own throat ring, so there is no join to seal.
  const circle = (radius, z) =>
    addRing(mesh, Array.from({ length: segments }, (_, i) => {
      const theta = (i / segments) * TAU;
      return [Math.cos(theta) * radius, Math.sin(theta) * radius, z];
    }));

  const throatOuter = Array.from({ length: segments }, (_, i) => i);
  const throatInner = throatOuter.map(inner);
  const baseOuter = circle(s.throatRadius, 0);
  const baseBore = circle(s.boreRadius, 0);
  const topBore = circle(s.boreRadius, baseZ);

  bridgeRings(mesh, baseOuter, baseBore, false);   // the face that sits on the bed
  bridgeRings(mesh, throatInner, topBore, true);   // the ledge the wall rises from
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    mesh.addTriangle(baseOuter[i], baseOuter[j], throatOuter[j]);
    mesh.addTriangle(baseOuter[i], throatOuter[j], throatOuter[i]);
    mesh.addTriangle(baseBore[i], topBore[j], baseBore[j]);
    mesh.addTriangle(baseBore[i], topBore[i], topBore[j]);
  }

  return { mesh, manifold: checkManifold(mesh), shell: { ...grown, spec: s, normals, halfAt } };
}
