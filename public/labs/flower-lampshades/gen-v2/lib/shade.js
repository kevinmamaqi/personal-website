// The flower shade: one thin-walled surface built as a stack of closed curves,
// so a slicer in vase mode prints it as a single continuous bead.
//
//   layer(v) = R(v) · C(t(v)) · (1 + ripple(v)),  rotated by twist(v)
//
//   1. silhouette   R(v)   the outline, seen from the side
//   2. cross-section C(t)  a closed curve that morphs from a round throat to
//                          the rim shape as t runs 0 -> 1
//   3. twist + ripple      the spiral, and the corrugation that stiffens a wall
//
// The cross-section has two sources, and that is the interesting part:
//
//   'superformula' — a closed-form radial curve. Fast, exactly symmetric, and
//     what the fluted shades use. It can only ever describe r(theta).
//
//   'growth' — differential growth, simulated. The curve is grown rather than
//     evaluated, so it is not single-valued in theta and no surface of
//     revolution can express it. The morph parameter t is *growth time*: the
//     shade is the history of a growing edge, throat at t=0 and rim at t=1.
//     See growth.js for why a petal margin ruffles.
//
// The part is a shell, not a solid: there is a hole straight through it for the
// bulb, and the first few millimetres are a flat annular flange that the collar
// clamps against.

import { TAU, clamp, lerp, monotoneSpline, smoothstep, superformula } from './math.js';
import { checkManifold, stitchRings } from './mesh.js';
import { maxStepToPrevious, offsetInward, peakRadius, toCCW } from './curve.js';
import { growCurve, resampleClosed } from './growth.js';
import { PETAL, clearanceBore } from './thread.js';
import { SHELL_DEFAULTS, buildShellShade } from './shell.js';

export const SHADE_DEFAULTS = {
  height: 180,           // mm, flange to rim
  silhouette: [[0, 34], [0.35, 58], [0.75, 80], [1, 74]], // [v, radius mm] above the throat
  // Petal shape at the rim. n3 is not listed because it is not free: see
  // resolveShade() for why it always follows n2.
  section: { kind: 'superformula', m: 6, n1: 0.7, n2: 1.2 },
  // Set this and the shade stops being a stack of rings altogether: the wall
  // becomes a grown elastic sheet. See shell.js. `section` is then unused.
  surface: null,
  sectionBase: null,     // petal shape at the throat; null -> a circle
  sectionBlend: 1.6,     // >1 keeps the throat round longer before the petals open
  twistTurns: 0.25,      // full turns of rotation from throat to rim
  rippleAmplitude: 0,    // fraction of radius, vertical corrugation
  rippleCount: 0,        // corrugations up the height
  // The throat is fixed by the hardware: it has to clear the PETAL-56 spigot on
  // the collar, which in turn has to clear a 40 mm E27 lampholder body.
  throatRadius: 34,      // mm, outer radius where the shade meets the collar
  throatHeight: 10,      // mm of straight parallel throat before the flower opens
  boreRadius: clearanceBore(PETAL), // 28.7 mm, drops over the collar spigot
  flangeThickness: 1.6,  // mm, the solid mounting ring at the bottom
  wallThickness: 0.8,    // mm, matches the vase-mode line width
  segmentsU: 256,
  segmentsV: 200,
};

// n1 = n2 = n3 = 2 makes the superformula collapse to cos^2 + sin^2 = 1, i.e. a
// perfect circle, for ANY m. That is the throat: a circle that already knows how
// many petals it will grow.
const roundSection = (m) => ({ m, n1: 2, n2: 2, n3: 2 });

/** Resolve a spec against the defaults, keeping nested objects intact. */
export function resolveShade(spec = {}) {
  const shade = { ...SHADE_DEFAULTS, ...spec };
  if (spec.surface) {
    shade.surface = { ...SHELL_DEFAULTS, ...spec.surface };
    return shade; // a grown surface has no cross-section to normalise
  }
  shade.section = { kind: 'superformula', ...SHADE_DEFAULTS.section, ...(spec.section ?? {}) };

  if (shade.section.kind === 'growth') return shade;

  // The petal count must never be interpolated. A non-integer m produces a
  // superformula curve that does not close on itself, and the seam at theta=0
  // shows up as a vertical slash the nozzle cannot follow.
  const m = shade.section.m;
  shade.sectionBase = { ...roundSection(m), ...(spec.sectionBase ?? {}), m };
  // n3 is not a free parameter either: the superformula is only m-fold
  // symmetric when the two exponents match. With n2 != n3 the cos and sin terms
  // stop swapping cleanly, every other lobe takes a different shape, and you
  // get m/2 petals for even m and no rotational symmetry at all for odd m. A
  // shade that quietly grows half the petals you asked for is a bug, so the
  // petal count wins and n3 follows n2.
  shade.section.n3 = shade.section.n2;
  shade.sectionBase.n3 = shade.sectionBase.n2;
  return shade;
}

const circleAt = (segments) =>
  Array.from({ length: segments }, (_, i) => {
    const theta = (i / segments) * TAU;
    return [Math.cos(theta), Math.sin(theta)];
  });

/** Normalise a closed curve to peak radius 1, so R(v) stays the true max radius. */
function unit(points) {
  const peak = peakRadius(points) || 1;
  return points.map(([x, y]) => [x / peak, y / peak]);
}

// Growing a curve costs a few hundred milliseconds, and the preview rebuilds a
// shade on every slider drag. The stages only depend on the growth parameters,
// so cache on those and let height, silhouette and twist stay free.
const growthCache = new Map();

function grownStages(params, segments) {
  const key = JSON.stringify({ ...params, segments });
  let entry = growthCache.get(key);
  if (entry) return entry;

  const { kind, stages: count, ...options } = params;
  const stages = growCurve(options, count).map((stage) =>
    unit(toCCW(resampleClosed(stage, segments)))
  );

  // Reparameterise growth time by how much the shape actually changes.
  //
  // Growth is bursty: the curve sits still for several stages and then a
  // section of it buckles. Mapping height uniformly onto stage number spends
  // the same few millimetres of height on a buckling event as on a quiet
  // stretch, and the overhang limit is set by the worst layer, not the average
  // one. Walking equal *shape distance* per unit height instead spreads every
  // burst over the height it needs, which is what brings the peak overhang down
  // to something a printer will actually bridge.
  const travel = [0];
  for (let i = 1; i < stages.length; i++) {
    travel.push(travel[i - 1] + Math.max(maxStepToPrevious(stages[i], stages[i - 1]), 1e-6));
  }
  const total = travel[travel.length - 1];

  entry = { stages, travel, total };
  growthCache.set(key, entry);
  return entry;
}

/**
 * The cross-section as a function of morph amount t, in normalised units.
 * Returns a closed curve of `segments` points with peak radius 1.
 */
function sectionSource(s, segments) {
  if (s.section.kind === 'growth') {
    const { stages, travel, total } = grownStages(s.section, segments);
    return (t) => {
      // t is not stage number but distance travelled through shape space, so
      // that equal height buys equal deformation. Find the stage pair holding
      // this much travel and interpolate between them, so the stacked surface
      // is smooth rather than stepped at each snapshot.
      const target = clamp(t, 0, 1) * total;
      let i = 0;
      let hi = stages.length - 1;
      while (hi - i > 1) {
        const mid = (i + hi) >> 1;
        if (travel[mid] <= target) i = mid;
        else hi = mid;
      }
      const span = travel[i + 1] - travel[i] || 1e-9;
      const f = clamp((target - travel[i]) / span, 0, 1);

      // Catmull-Rom through four stages, not a straight line between two. A
      // linear blend is only C0: the surface tangent jumps at every snapshot,
      // and 45 snapshots up a 200 mm shade print as 45 faint horizontal
      // creases. Matching the tangents removes them.
      const last = stages.length - 1;
      const p0 = stages[Math.max(0, i - 1)];
      const p1 = stages[i];
      const p2 = stages[i + 1];
      const p3 = stages[Math.min(last, i + 2)];
      const f2 = f * f;
      const f3 = f2 * f;
      const w0 = -0.5 * f3 + f2 - 0.5 * f;
      const w1 = 1.5 * f3 - 2.5 * f2 + 1;
      const w2 = -1.5 * f3 + 2 * f2 + 0.5 * f;
      const w3 = 0.5 * f3 - 0.5 * f2;
      return unit(
        p1.map((_, k) => [
          p0[k][0] * w0 + p1[k][0] * w1 + p2[k][0] * w2 + p3[k][0] * w3,
          p0[k][1] * w0 + p1[k][1] * w1 + p2[k][1] * w2 + p3[k][1] * w3,
        ])
      );
    };
  }

  // Both endpoints are radial and share the theta parameterisation, so blending
  // the points is the same thing as blending the radii - which is what makes
  // lobe depth linear in the blend. Blending the superformula *exponents*
  // instead was a real bug: depth is violently nonlinear in n1/n2/n3, so the
  // section stayed over 90% circular for the first third of the flare and grew
  // petals only in the last few percent. Every shade came out a smooth vase.
  const sample = (params) => {
    const raw = Array.from({ length: segments }, (_, i) => {
      const theta = (i / segments) * TAU;
      const r = superformula(theta, params);
      return [Math.cos(theta) * r, Math.sin(theta) * r];
    });
    return unit(raw);
  };
  const throat = sample(s.sectionBase);
  const rim = sample(s.section);
  return (t) => unit(throat.map(([ax, ay], k) => [lerp(ax, rim[k][0], t), lerp(ay, rim[k][1], t)]));
}

/**
 * The layer geometry of a shade. Exposed on its own so the printability checks
 * can walk it without building a mesh.
 */
export function shadeField(spec, segments) {
  const s = resolveShade(spec);
  const segmentsU = segments ?? s.segmentsU;
  const silhouette = monotoneSpline(s.silhouette);
  const throatFraction = clamp(s.throatHeight / s.height, 0, 0.9);
  const section = sectionSource(s, segmentsU);
  const circle = circleAt(segmentsU);

  /** The outer wall curve at height fraction v, in millimetres. */
  const ringAt = (v) => {
    const throatRing = circle.map(([x, y]) => [x * s.throatRadius, y * s.throatRadius]);
    if (v <= throatFraction) return throatRing;

    // Remap so the flower still uses its full 0..1 range above the throat.
    const vf = (v - throatFraction) / (1 - throatFraction);
    const t = Math.pow(smoothstep(vf), s.sectionBlend);
    const curve = section(t);

    const spin = s.twistTurns * vf * TAU;
    const cos = Math.cos(spin);
    const sin = Math.sin(spin);
    let scale = silhouette(vf);
    if (s.rippleAmplitude > 0 && s.rippleCount > 0) {
      scale *= 1 + s.rippleAmplitude * Math.sin(vf * s.rippleCount * TAU);
    }

    const ring = curve.map(([x, y]) => [
      (x * cos - y * sin) * scale,
      (x * sin + y * cos) * scale,
    ]);

    // Ease out of the straight throat so the join is a fillet, not a step.
    const blend = smoothstep(vf / 0.08);
    if (blend >= 1) return ring;
    return ring.map(([x, y], k) => [
      lerp(throatRing[k][0], x, blend),
      lerp(throatRing[k][1], y, blend),
    ]);
  };

  return { spec: s, silhouette, throatFraction, segmentsU, ringAt, z: (v) => v * s.height };
}

/**
 * @returns {{ mesh, field, manifold }}
 */
export function buildShade(spec = {}, { onProgress = null } = {}) {
  const resolved = resolveShade(spec);
  if (resolved.surface) return { ...buildShellShade(resolved, { onProgress }), field: null };

  const field = shadeField(spec);
  const s = field.spec;
  const segmentsU = field.segmentsU;
  const circle = circleAt(segmentsU);
  const rows = [];

  const scaled = (r) => circle.map(([x, y]) => [x * r, y * r]);

  // 1. The mounting flange: a flat solid ring, printed as bottom solid layers.
  const flangeOuter = scaled(s.throatRadius);
  const flangeInner = scaled(s.boreRadius);
  rows.push({ z: 0, outer: flangeOuter, inner: flangeInner });
  rows.push({ z: s.flangeThickness, outer: flangeOuter, inner: flangeInner });
  // 2. The ledge where the flange becomes a single wall.
  rows.push({ z: s.flangeThickness, outer: flangeOuter, inner: scaled(s.throatRadius - s.wallThickness) });

  // 3. The wall itself, offset inward along the curve normal by one line width.
  //    Not radially: at a ruffle the fold points back toward the axis, and a
  //    radial offset there would push the inner wall through the outer one.
  for (let j = 0; j <= s.segmentsV; j++) {
    const v = j / s.segmentsV;
    const z = s.flangeThickness + v * (s.height - s.flangeThickness);
    if (z <= s.flangeThickness) continue;
    const outer = field.ringAt(v);
    rows.push({ z, outer, inner: offsetInward(outer, s.wallThickness) });
  }

  const { mesh } = stitchRings(rows, s.name ?? 'shade');
  return { mesh, field, manifold: checkManifold(mesh) };
}
