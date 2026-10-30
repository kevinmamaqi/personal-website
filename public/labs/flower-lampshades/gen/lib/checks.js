// Printability analysis.
//
// A flower shade can be beautiful and still be unprintable. These checks run on
// the radius field before anything is exported, and every build prints the
// result, so a bad silhouette is caught in a second rather than six hours in.

import { checkManifold, signedVolume } from './mesh.js';
import { maxStepToPrevious, minConvexTurnRadius, minSelfDistance, perimeter } from './curve.js';
import { minSheetGap } from './shell.js';

export const PRINT_DEFAULTS = {
  nozzle: 0.4,
  lineWidth: 0.8,      // vase-mode wall: deliberately wider than the nozzle
  layerHeight: 0.28,
  speed: 40,           // mm/s outer wall
  bed: [250, 250, 250],// mm, X Y Z build volume
  maxOverhang: 50,     // degrees from vertical, for the single-bead vase wall
  filamentDiameter: 1.75,
  // A shell's overhang limit is not a constant, and writing one down as if it
  // were is how 50 degrees became folklore. What actually has to be true is
  // that each layer's outer bead lands on the one below it. A wall leaning
  // theta from vertical shifts by layerHeight * tan(theta) per layer, so the
  // overlap left on a bead of width w is w - layerHeight * tan(theta), and the
  // limit follows from the two settings rather than from a table:
  //
  //   theta_max = atan( shellLineWidth * (1 - beadOverlap) / layerHeight )
  //
  // At the defaults that is 50.3 degrees, which is why the folklore number is
  // usually right. Halve the layer height and it is 66. That is a real trade -
  // overhang is bought with print time - and it belongs in the spec, where it
  // can be seen, rather than in a constant.
  shellLineWidth: 0.45, // perimeter extrusion width for a shell part
  beadOverlap: 0.25,    // fraction of a bead that must sit on the bead below
  // A grown shade prints in normal mode, not vase mode, so a single steep
  // triangle is not a failure - a real printer bridges a few square millimetres
  // of 70-degree wall without noticing. What matters is how much of the surface
  // is steep, so the budget is an area fraction rather than an angle limit.
  steepAreaFraction: 0.03,
};

/**
 * @param {object} field  from shadeField()
 * @param {object} [print] overrides for PRINT_DEFAULTS
 */
export function analyseShade(field, print = {}) {
  const p = { ...PRINT_DEFAULTS, ...print };
  const s = field.spec;
  const layers = Math.max(2, Math.floor(s.height / p.layerHeight));

  let maxOverhangDeg = 0;
  let maxOverhangZ = 0;
  let minRadius = Infinity;
  let maxRadius = 0;
  let pathLength = 0;

  // The geometry checks below are far more expensive than the per-layer walk and
  // vary slowly up the shade, so sample them rather than run them on all ~700
  // layers. The overhang measure needs every layer, because it is a difference
  // between neighbours.
  const PROBES = 72;
  const probeEvery = Math.max(1, Math.floor(layers / PROBES));
  let minWallGap = Infinity;
  let minWallGapZ = 0;
  let tightestTurn = Infinity;
  let tightestTurnZ = 0;

  let previous = null;
  for (let l = 0; l <= layers; l++) {
    const z = (l / layers) * s.height;
    const ring = field.ringAt(z / s.height);

    pathLength += perimeter(ring);
    for (const [x, y] of ring) {
      const r = Math.hypot(x, y);
      if (r < minRadius) minRadius = r;
      if (r > maxRadius) maxRadius = r;
    }

    if (previous) {
      // How far a bead sits from the nearest part of the bead below it. The old
      // measure differenced r(u) between layers, which only means anything while
      // both layers share a parameterisation - grown layers do not.
      const dz = s.height / layers;
      const step = maxStepToPrevious(ring, previous);
      const deg = (Math.atan2(step, dz) * 180) / Math.PI;
      if (deg > maxOverhangDeg) {
        maxOverhangDeg = deg;
        maxOverhangZ = z;
      }
    }

    if (l % probeEvery === 0 || l === layers) {
      const gap = minSelfDistance(ring);
      if (gap < minWallGap) {
        minWallGap = gap;
        minWallGapZ = z;
      }
      const turn = minConvexTurnRadius(ring);
      if (turn < tightestTurn) {
        tightestTurn = turn;
        tightestTurnZ = z;
      }
    }

    previous = ring;
  }

  const diameter = maxRadius * 2;
  const wallVolume = pathLength * p.lineWidth * p.layerHeight;
  const bottomVolume = Math.PI * Math.pow(s.throatRadius, 2) * (p.layerHeight * 5);
  const volume = wallVolume + bottomVolume;
  const filamentArea = Math.PI * Math.pow(p.filamentDiameter / 2, 2);
  const filamentLength = volume / filamentArea;
  const minutes = pathLength / p.speed / 60;

  const issues = [];
  if (maxOverhangDeg > p.maxOverhang) {
    issues.push(
      `Overhang ${maxOverhangDeg.toFixed(1)}deg at z=${maxOverhangZ.toFixed(0)}mm exceeds ${p.maxOverhang}deg. ` +
        `Flatten the silhouette there or add height.`
    );
  }
  if (diameter > p.bed[0] || diameter > p.bed[1]) {
    issues.push(`Diameter ${diameter.toFixed(0)}mm does not fit the ${p.bed[0]}x${p.bed[1]}mm bed.`);
  }
  if (s.height > p.bed[2]) {
    issues.push(`Height ${s.height}mm exceeds the ${p.bed[2]}mm Z range.`);
  }
  if (minRadius <= p.lineWidth) {
    issues.push(`Cross-section collapses to ${minRadius.toFixed(2)}mm radius; the valleys between petals are too deep.`);
  }
  // Two walls closer than a line width fuse into a blob on the way past each
  // other. A radial section could never do this - r(theta) cannot fold back on
  // itself - but a grown one folds by design, so it has to be measured.
  if (minWallGap < p.lineWidth * 1.5) {
    issues.push(
      `Fold at z=${minWallGapZ.toFixed(0)}mm brings two walls within ${minWallGap.toFixed(2)}mm; ` +
        `below ${(p.lineWidth * 1.5).toFixed(2)}mm they fuse. Grow the curve less, or scale the shade up.`
    );
  }
  // The inner wall is the outer one pushed in by a line width, so a convex turn
  // tighter than that folds the shell through itself.
  if (tightestTurn < p.lineWidth * 1.2) {
    issues.push(
      `Turn at z=${tightestTurnZ.toFixed(0)}mm has a ${tightestTurn.toFixed(2)}mm radius; ` +
        `the ${p.lineWidth}mm inner wall inverts below ${(p.lineWidth * 1.2).toFixed(2)}mm.`
    );
  }
  if (s.throatRadius * 2 < 40) {
    issues.push(`Throat diameter ${(s.throatRadius * 2).toFixed(0)}mm gives a small footprint; expect adhesion trouble without a brim.`);
  }

  return {
    layers,
    diameter,
    height: s.height,
    minRadius,
    minWallGap,
    tightestTurn,
    maxOverhangDeg,
    maxOverhangZ,
    pathLengthM: pathLength / 1000,
    volumeCm3: volume / 1000,
    filamentM: filamentLength / 1000,
    grams: (volume / 1000) * 1.24, // PLA density 1.24 g/cm3
    minutes,
    wallThickness: p.lineWidth,
    print: p,
    issues,
    printable: issues.length === 0,
  };
}

/**
 * Printability of a grown shell, measured on the mesh.
 *
 * The radial checks cannot be reused here. They walk layers of a stack of rings
 * and a grown surface is not one: a horizontal slice through a ruffle is
 * several disconnected arcs, and it is exactly that property - one layer, more
 * than one loop - that takes these shades out of vase mode and into normal
 * mode, two perimeters and no infill.
 *
 * @param {object} built  from buildShellShade()
 * @param {object} [print] overrides for PRINT_DEFAULTS
 */
export function analyseShell(built, print = {}) {
  const p = { ...PRINT_DEFAULTS, ...print };
  const { mesh, shell } = built;
  const s = shell.spec;
  const bounds = mesh.bounds();
  const diameter = Math.max(bounds.size[0], bounds.size[1]);
  const height = bounds.max[2];
  const layers = Math.max(2, Math.floor(height / p.layerHeight));

  const limitDeg = (Math.atan((p.shellLineWidth * (1 - p.beadOverlap)) / p.layerHeight) * 180) / Math.PI;
  const overhang = overhangAudit(mesh, { limitDeg, ignoreBelowZ: s.flangeThickness + 0.5 });
  // Half the mesh area, because every face of the mid-surface was doubled into
  // an outer and an inner sheet, and the budget is about the shade's surface.
  const area = surfaceArea(mesh) / 2;
  const steepFraction = area > 0 ? overhang.steepAreaMm2 / area : 0;
  const foldGuard = Math.max(6, s.wallThickness * 6);
  const closest = minSheetGap(shell.positions, shell.faces, shell.vertexCount, { guard: foldGuard });
  const sheetGap = closest.gap;
  const foldThicknesses = closest.pair
    ? closest.pair.map((i) => shell.halfAt[i] * 2)
    : null;
  // halfAt holds half of each local full wall. Their sum is therefore the mean
  // of the two full walls: (2a + 2b) / 2 = a + b.
  const foldThreshold = closest.pair
    ? 1.5 * (shell.halfAt[closest.pair[0]] + shell.halfAt[closest.pair[1]])
    : Infinity;

  const volume = signedVolume(mesh);
  const filamentArea = Math.PI * Math.pow(p.filamentDiameter / 2, 2);
  // Normal mode lays the wall down as beads a nozzle wide, so the path length
  // is the solid's own volume divided by a bead's cross-section - which works
  // whatever the topology does, unlike a per-layer perimeter sum.
  const pathLength = volume / (p.nozzle * p.layerHeight);

  const issues = [];
  if (steepFraction > p.steepAreaFraction) {
    issues.push(
      `${overhang.steepAreaMm2.toFixed(0)}mm2 of surface is steeper than ${limitDeg.toFixed(0)}deg ` +
        `(${(steepFraction * 100).toFixed(1)}% of ${area.toFixed(0)}mm2, budget ${(p.steepAreaFraction * 100).toFixed(0)}%). ` +
        `Raise the sheet's lift so the pleats fold up rather than out, drop the layer height ` +
        `(${p.layerHeight}mm buys ${limitDeg.toFixed(0)}deg, 0.15mm buys ${((Math.atan((p.shellLineWidth * (1 - p.beadOverlap)) / 0.15) * 180) / Math.PI).toFixed(0)}deg), ` +
        `or start growth lower down so the ruffles are broad rather than curled.`
    );
  }
  if (sheetGap < foldThreshold) {
    issues.push(
      `A fold brings two sheets within ${sheetGap.toFixed(2)}mm; below ${foldThreshold.toFixed(2)}mm ` +
        `the local ${foldThicknesses.map((t) => t.toFixed(2)).join('/')}mm walls fuse. Grow less, or scale the shade up.`
    );
  }
  if (diameter > p.bed[0] || diameter > p.bed[1]) {
    issues.push(`Diameter ${diameter.toFixed(0)}mm does not fit the ${p.bed[0]}x${p.bed[1]}mm bed.`);
  }
  if (height > p.bed[2]) {
    issues.push(`Height ${height.toFixed(0)}mm exceeds the ${p.bed[2]}mm Z range.`);
  }
  if (shell.strain > 0.03) {
    issues.push(
      `The growth solver left ${(shell.strain * 100).toFixed(1)}% mean edge strain, so the mesh is ` +
        `still under load and the shape is not an equilibrium. Raise iterations, or grow less per stage.`
    );
  }

  return {
    mode: 'shell',
    layers,
    diameter,
    height,
    minRadius: NaN,
    minWallGap: sheetGap,
    foldGuard,
    foldPair: closest.pair,
    foldThreshold,
    tightestTurn: NaN,
    maxOverhangDeg: overhang.maxDeg,
    overhangLimitDeg: limitDeg,
    maxOverhangZ: NaN,
    steepAreaMm2: overhang.steepAreaMm2,
    steepFraction,
    surfaceAreaMm2: area,
    strain: shell.strain,
    vertexCount: shell.vertexCount,
    pathLengthM: pathLength / 1000,
    volumeCm3: volume / 1000,
    filamentM: volume / filamentArea / 1000,
    grams: (volume / 1000) * 1.24,
    minutes: pathLength / p.speed / 60,
    wallThickness: s.wallThickness,
    marginThickness: s.wallThickness * (1 - (s.surface?.wallTaper ?? 0)),
    print: p,
    issues,
    printable: issues.length === 0,
  };
}

/** Total triangle area of a mesh, in mm^2. */
export function surfaceArea(mesh) {
  const { positions, indices } = mesh;
  let total = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3;
    const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    total += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }
  return total;
}

/** Human-readable one-block summary, used by the CLI and the preview. */
export function formatReport(name, analysis, manifold) {
  const hours = Math.floor(analysis.minutes / 60);
  const mins = Math.round(analysis.minutes % 60);
  const lines = [
    `${name}`,
    `  size          ${analysis.diameter.toFixed(0)} mm dia x ${analysis.height.toFixed(0)} mm tall`,
    `  layers        ${analysis.layers} at ${analysis.print.layerHeight} mm`,
    analysis.mode === 'shell'
      ? `  wall          ${analysis.wallThickness} mm shell${analysis.marginThickness < analysis.wallThickness ? `, tapering to ${analysis.marginThickness.toFixed(2)} mm at the margin` : ''} (normal mode, 2 walls, no infill - NOT vase mode)`
      : `  wall          ${analysis.wallThickness} mm (single bead, vase mode)`,
    analysis.mode === 'shell'
      ? `  overhang      ${analysis.steepAreaMm2.toFixed(0)} mm2 past ${analysis.overhangLimitDeg.toFixed(0)} deg` +
        ` (${(analysis.steepFraction * 100).toFixed(1)}% of surface, budget ${(analysis.print.steepAreaFraction * 100).toFixed(0)}%),` +
        ` steepest ${analysis.maxOverhangDeg.toFixed(0)} deg` +
        `\n  limit from    ${analysis.print.layerHeight} mm layers at ${analysis.print.shellLineWidth} mm bead`
      : `  max overhang  ${analysis.maxOverhangDeg.toFixed(1)} deg from vertical (limit ${analysis.print.maxOverhang})`,
    analysis.mode === 'shell'
      ? `  tightest fold ${analysis.minWallGap === Infinity ? `none within ${analysis.foldGuard.toFixed(0)} mm` : `${analysis.minWallGap.toFixed(2)} mm gap against ${analysis.foldThreshold.toFixed(2)} mm local threshold`},` +
        ` ${(analysis.strain * 100).toFixed(2)}% residual strain, ${analysis.vertexCount} grown vertices`
      : `  tightest fold ${analysis.minWallGap === Infinity ? 'none' : analysis.minWallGap.toFixed(2) + ' mm gap'}, ${analysis.tightestTurn.toFixed(2)} mm turn`,
    `  filament      ${analysis.filamentM.toFixed(1)} m / ${analysis.grams.toFixed(0)} g`,
    `  print time    ~${hours}h ${mins}m at ${analysis.print.speed} mm/s`,
  ];
  if (manifold) {
    lines.push(`  mesh          ${manifold.watertight ? 'watertight' : 'NOT WATERTIGHT'} (${analysis.layers ? '' : ''}${manifold.edgeCount} edges)`);
  }
  if (analysis.issues.length) {
    lines.push('  issues:');
    for (const issue of analysis.issues) lines.push(`    - ${issue}`);
  } else {
    lines.push('  issues        none');
  }
  return lines.join('\n');
}

export { checkManifold };

/**
 * Down-facing surface audit, for the parts that print in normal mode.
 *
 * A triangle whose normal points downward is printing over air. The angle from
 * vertical is asin(|nz|): 0 is a vertical wall, 90 is a flat ceiling.
 *
 * Two things are deliberately tolerated. Faces on the bed are not overhangs at
 * all, and the small ledge where a female thread begins is a sub-2 mm bridge
 * every printer handles. So the audit reports total *area* of steep down-facing
 * surface and compares it to a budget, rather than failing on a single triangle.
 */
export function overhangAudit(mesh, { limitDeg = 50, ignoreBelowZ = 0.5 } = {}) {
  const { positions, indices } = mesh;
  const limit = Math.sin((limitDeg * Math.PI) / 180);
  let steepArea = 0;
  let maxDeg = 0;

  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3;
    const b = indices[t + 1] * 3;
    const c = indices[t + 2] * 3;

    if (Math.max(positions[a + 2], positions[b + 2], positions[c + 2]) < ignoreBelowZ) continue;

    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    if (len === 0) continue;

    if (nz >= 0) continue; // faces up or sideways: supported
    const sin = -nz / len;
    const deg = (Math.asin(Math.min(1, sin)) * 180) / Math.PI;
    if (deg > maxDeg) maxDeg = deg;
    if (sin > limit) steepArea += len / 2;
  }

  return { steepAreaMm2: steepArea, maxDeg };
}
