// Differential growth: the cross-section as a *simulation* rather than a formula.
//
// A real petal margin ruffles because the edge grows faster than the tissue
// behind it. The extra length has nowhere to go in the plane, so the sheet
// buckles out of it. Kale, petunia, calla and lettuce all get their edges this
// way, and it is the one thing a lathe-shaped surface of revolution can never
// reproduce: the resulting curve is not single-valued in theta, so there is no
// r(theta) that describes it.
//
// The model is the standard one. Every step, each node:
//
//   1. is pulled toward its two neighbours (the sheet resists tearing),
//   2. is pushed away from every other node within a radius (it cannot pass
//      through itself),
//   3. relaxes toward the midpoint of its neighbours (bending stiffness),
//
// and any edge stretched past a threshold splits in two. That splitting is the
// growth; the repulsion is what turns the surplus length into ruffles instead
// of a self-intersecting tangle.
//
// Determinism matters: a build must produce the same STL twice. The only
// randomness is the seeded jitter that breaks the initial circle's symmetry,
// because a perfectly symmetric circle grows into a perfectly symmetric circle.

import { TAU } from './math.js';

/** mulberry32: small, fast, and good enough to break a symmetry reproducibly. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GROWTH_DEFAULTS = {
  nodes: 90,            // starting node count
  stages: 60,           // snapshots, and growth increments - one per stage
  growPerStage: 0.02,   // new nodes per existing node, per stage
  relaxSteps: 26,       // relaxation steps between growth increments
  spacing: 1,           // target edge length; the curve is normalised at the end
  repulsionRadius: 3.4, // in multiples of spacing
  attraction: 0.36,
  repulsion: 0.62,
  smoothing: 0.22,
  splitAbove: 1.5,      // safety split for any edge that stretches anyway
  maxNodes: 1200,       // hard stop, so a runaway parameter set cannot hang a build
  seed: 1,
  jitter: 0.06,         // initial symmetry break, as a fraction of spacing
  maxStep: 0.5,         // furthest a node may travel in one step, in spacings
};

/**
 * Grow a closed curve, returning one snapshot per stage.
 *
 * Growth is **quasi-static**: each stage injects a small amount of new length
 * and then relaxes the curve back toward equilibrium before the snapshot is
 * taken. That is how a petal actually grows - tissue is added far more slowly
 * than the sheet relieves its own stress - and it is also the only way the
 * result is printable.
 *
 * Interleaving growth and relaxation step-by-step instead, which is the obvious
 * way to write this, leaves every snapshot mid-relaxation. Nodes are still
 * travelling up to half a spacing per step, so consecutive snapshots differ by
 * millimetres of jitter that has nothing to do with the shape. Stacked into a
 * shade at a 0.28 mm layer height that reads as an 80 degree overhang on a form
 * whose actual silhouette is nowhere near that steep: the surface is not steep,
 * it is noisy. Relaxing to equilibrium first makes consecutive stages differ by
 * the growth increment alone.
 *
 * Stage 0 is the starting circle and the last is the most ruffled, which is the
 * sequence a shade needs going up: a round throat opening into a ruffled lip.
 *
 * @returns {Array<Array<[number, number]>>} each stage normalised to peak radius 1
 */
export function growCurve(options = {}, stageCount) {
  const o = { ...GROWTH_DEFAULTS, ...options };
  const stages = stageCount ?? o.stages;
  const random = rng(o.seed);

  const startRadius = (o.nodes * o.spacing) / TAU;
  const xs = new Float64Array(o.maxNodes + 2);
  const ys = new Float64Array(o.maxNodes + 2);
  let n = o.nodes;
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * TAU;
    const r = startRadius + (random() - 0.5) * 2 * o.jitter * o.spacing;
    xs[i] = Math.cos(theta) * r;
    ys[i] = Math.sin(theta) * r;
  }

  const fx = new Float64Array(o.maxNodes + 2);
  const fy = new Float64Array(o.maxNodes + 2);
  const repelR = o.repulsionRadius * o.spacing;
  const maxStep = o.maxStep * o.spacing;

  const insertAt = (i) => {
    const j = (i + 1) % n;
    const mx = (xs[i] + xs[j]) / 2;
    const my = (ys[i] + ys[j]) / 2;
    for (let k = n; k > i + 1; k--) {
      xs[k] = xs[k - 1];
      ys[k] = ys[k - 1];
    }
    xs[i + 1] = mx;
    ys[i + 1] = my;
    n += 1;
  };

  const relax = () => {
    fx.fill(0, 0, n);
    fy.fill(0, 0, n);

    // Neighbour springs and bending stiffness: both local, both cheap.
    for (let i = 0; i < n; i++) {
      const prev = (i - 1 + n) % n;
      const next = (i + 1) % n;
      for (const j of [prev, next]) {
        const dx = xs[j] - xs[i];
        const dy = ys[j] - ys[i];
        const d = Math.hypot(dx, dy) || 1e-9;
        const pull = (d - o.spacing) / d;
        fx[i] += dx * pull * o.attraction;
        fy[i] += dy * pull * o.attraction;
      }
      const mx = (xs[prev] + xs[next]) / 2;
      const my = (ys[prev] + ys[next]) / 2;
      fx[i] += (mx - xs[i]) * o.smoothing;
      fy[i] += (my - ys[i]) * o.smoothing;
    }

    // Repulsion, through a uniform grid: the pairwise loop is O(n^2) and n
    // reaches four figures, which is slow enough to matter in a build.
    const cell = repelR;
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      const key = `${Math.floor(xs[i] / cell)},${Math.floor(ys[i] / cell)}`;
      let bucket = grid.get(key);
      if (!bucket) grid.set(key, (bucket = []));
      bucket.push(i);
    }
    for (let i = 0; i < n; i++) {
      const cx = Math.floor(xs[i] / cell);
      const cy = Math.floor(ys[i] / cell);
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const bucket = grid.get(`${gx},${gy}`);
          if (!bucket) continue;
          for (const j of bucket) {
            if (j === i) continue;
            // Neighbours are held by the spring above; repelling them too would
            // just fight it and stiffen the curve back into a circle.
            if (j === (i + 1) % n || j === (i - 1 + n) % n) continue;
            const dx = xs[i] - xs[j];
            const dy = ys[i] - ys[j];
            const d = Math.hypot(dx, dy);
            if (d >= repelR || d === 0) continue;
            const push = ((repelR - d) / repelR) * o.repulsion;
            fx[i] += (dx / d) * push;
            fy[i] += (dy / d) * push;
          }
        }
      }
    }

    // Clamp the step. This is explicit integration, so a parameter set whose
    // weights sum past 1 oscillates and then diverges - attraction counts twice
    // (once per neighbour), so smoothing 0.4 is already enough to do it. The
    // coordinates run away, every node lands in one hash bucket, and the
    // repulsion pass silently degrades to O(n^2) on 1200 nodes: the build hangs
    // rather than fails, which is the worst way to be wrong. Bounding the step
    // makes every parameter set terminate.
    let travelled = 0;
    for (let i = 0; i < n; i++) {
      const mag = Math.hypot(fx[i], fy[i]);
      if (mag > maxStep) {
        const k = maxStep / mag;
        fx[i] *= k;
        fy[i] *= k;
      }
      xs[i] += fx[i];
      ys[i] += fy[i];
      const moved = Math.hypot(fx[i], fy[i]);
      if (moved > travelled) travelled = moved;
    }
    return travelled;
  };

  // Relax before the first snapshot. Stage 0 is otherwise the raw jittered
  // circle, and the jump from it to the first relaxed stage is an order of
  // magnitude larger than any later growth increment - a step change at the
  // throat of every shade that used one.
  let settled = 0;
  for (let k = 0; k < o.relaxSteps; k++) settled = relax();

  const out = [normalise(xs, ys, n)];
  let pending = 0;

  for (let stage = 1; stage < stages; stage++) {
    pending += n * o.growPerStage;
    while (pending >= 1 && n < o.maxNodes) {
      insertAt(Math.floor(random() * n));
      pending -= 1;
    }
    const limit = o.splitAbove * o.spacing;
    for (let i = n - 1; i >= 0 && n < o.maxNodes; i--) {
      const j = (i + 1) % n;
      if (Math.hypot(xs[j] - xs[i], ys[j] - ys[i]) > limit) insertAt(i);
    }

    for (let k = 0; k < o.relaxSteps; k++) settled = relax();
    out.push(normalise(xs, ys, n));
  }

  // How far the busiest node was still moving when the last snapshot was taken,
  // as a fraction of spacing. Small means the stages differ by growth rather
  // than by leftover motion, which is what keeps the stacked surface smooth.
  out.residual = settled / o.spacing;
  out.nodes = n;
  return out;
}

/** Centre on the centroid and scale so the furthest point sits at radius 1. */
function normalise(xs, ys, n) {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    cx += xs[i];
    cy += ys[i];
  }
  cx /= n;
  cy /= n;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.hypot(xs[i] - cx, ys[i] - cy);
    if (d > peak) peak = d;
  }
  const s = peak > 0 ? 1 / peak : 1;
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = [(xs[i] - cx) * s, (ys[i] - cy) * s];
  return out;
}

/**
 * Resample a closed curve to a fixed number of points, evenly by arc length.
 *
 * Every ring in the mesh needs the same point count, and the grown stages do
 * not: that is the whole point of growth. Arc-length resampling from a common
 * start keeps corresponding points on consecutive rings close together, which
 * is what keeps the stitched quads well-shaped.
 */
export function resampleClosed(points, count) {
  const n = points.length;
  const cumulative = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    cumulative[i + 1] = cumulative[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const total = cumulative[n];
  const out = new Array(count);
  let seg = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / count) * total;
    while (seg < n - 1 && cumulative[seg + 1] < target) seg += 1;
    const span = cumulative[seg + 1] - cumulative[seg] || 1e-9;
    const t = (target - cumulative[seg]) / span;
    const a = points[seg];
    const b = points[(seg + 1) % n];
    out[k] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  return out;
}
