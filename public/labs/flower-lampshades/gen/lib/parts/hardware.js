// The hardware: everything that is not a flower.
//
// These parts carry load and sit near the bulb, so they print in normal mode
// with walls and infill - never vase mode - and in PETG rather than PLA.
//
// Every step in every profile is either a 45-degree cone or an upward-facing
// ledge, which is why nothing here needs support material. If you change a
// dimension, keep that property: the test suite checks it.

import { TAU } from '../math.js';
import { checkManifold, stitchTube } from '../mesh.js';
import { KNUCKLE, PETAL, clearanceBore, femaleThreadField, maleThreadField } from '../thread.js';

export const HARDWARE = {
  nippleRadius: 5.2,   // M10x1 lampholder tube, with a printing allowance
  holderBore: 23,      // clears a 40 mm E27 lampholder body
  seatRadius: 34,      // the shade flange rests here; matches the shade throat
  wall: 3.8,
  stemOuter: KNUCKLE.majorDiameter / 2 + 2.4 + KNUCKLE.clearance, // 22.75
};

/** Sample a profile into stitchTube rows over a z range. */
function rows(z0, z1, steps, outer, inner) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const z = z0 + (z1 - z0) * t;
    out.push({ z, outer: (u) => outer(u, z), inner: (u) => inner(u, z) });
  }
  return out;
}

/** A 45-degree cone between two radii - the steepest step that needs no support. */
function cone(z0, r0, r1) {
  return { z1: z0 + Math.abs(r1 - r0), r: (z) => r0 + Math.sign(r1 - r0) * (z - z0) };
}

/**
 * COLLAR - the piece that turns a bought lampholder into a mount for a printed
 * shade.
 *
 * It screws onto the stem from below, the lampholder's own M10 nipple passes up
 * through its floor and is nutted inside the cup, and its PETAL-56 spigot
 * carries the shade. The cup is wider than the lampholder on purpose - that is
 * the reason the shade thread is 56 mm and not 40 mm.
 */
export function buildCollar({ segmentsU = 192 } = {}) {
  const t = HARDWARE;
  const knuckleLength = KNUCKLE.pitch * KNUCKLE.turns;               // 10
  const male = maleThreadField({ spec: KNUCKLE, startZ: 0, length: knuckleLength, taper: 0.6 });
  const knuckleCore = KNUCKLE.majorDiameter / 2 - KNUCKLE.depth;    // where the taper lands
  const shell = PETAL.majorDiameter / 2 - PETAL.depth;              // 26.8

  const skirt = cone(knuckleLength, knuckleCore, shell);
  const floorTop = 22;
  const flare = cone(floorTop, shell, t.seatRadius);                  // 22 -> 29.2
  const seatZ = flare.z1 + 3.8;
  const spigot = 17;
  const top = seatZ + spigot;

  const petal = maleThreadField({ spec: PETAL, startZ: seatZ, length: spigot, taper: 0.6 });

  const all = [
    // 1. Male KNUCKLE-40 spigot: screws down into the stem.
    ...rows(0, knuckleLength, 60, (u, z) => male(u, z), () => t.nippleRadius),
    // 2. 45-degree skirt out to the body.
    ...rows(knuckleLength, skirt.z1, 8, (u, z) => skirt.r(z), () => t.nippleRadius),
    // 3. The floor. The nipple passes through; its nut lands on top of this.
    ...rows(skirt.z1, floorTop, 2, () => shell, () => t.nippleRadius),
    { z: floorTop, outer: () => shell, inner: () => t.holderBore },
    // 4. 45-degree flare out to the seat.
    ...rows(floorTop, flare.z1, 8, (u, z) => flare.r(z), () => t.holderBore),
    // 5. The seat: a flat upward face for the shade flange to rest on.
    ...rows(flare.z1, seatZ, 2, () => t.seatRadius, () => t.holderBore),
    { z: seatZ, outer: (u) => petal(u, seatZ), inner: () => t.holderBore },
    // 6. Male PETAL-56 spigot: the shade drops over this, the ring clamps it.
    ...rows(seatZ, top, 90, (u, z) => petal(u, z), () => t.holderBore),
  ];

  const { mesh } = stitchTube(all, segmentsU, 'collar');
  return { mesh, manifold: checkManifold(mesh), seatZ, height: top };
}

/**
 * RING - screws onto the collar spigot and traps the shade's flange.
 *
 * This is what lets a 0.8 mm vase-mode wall be held by a thread it could never
 * contain: the shade is clamped between two flat faces, never threaded.
 */
export function buildRing({ segmentsU = 192 } = {}) {
  const lip = 3.4;
  const threadLength = 12;
  const height = lip + threadLength;
  const female = femaleThreadField({ spec: PETAL, startZ: lip, length: threadLength, taper: 0.6 });
  const chamfer = clearanceBore(PETAL) - (PETAL.majorDiameter / 2 - PETAL.depth + PETAL.clearance);
  const flange = HARDWARE.seatRadius + 2;   // overhangs the shade flange slightly
  const body = PETAL.majorDiameter / 2 + 3.2;

  const all = [
    // The clamping lip: its underside is the face that presses on the shade.
    ...rows(0, lip - chamfer, 2, () => flange, () => clearanceBore(PETAL)),
    // 45-degree chamfer in to the thread root, for the same reason as the stem.
    ...rows(lip - chamfer, lip, 4, () => flange, (u, z) => clearanceBore(PETAL) - (z - (lip - chamfer))),
    { z: lip, outer: () => body, inner: (u) => female(u, lip) },
    ...rows(lip, height, 70, () => body, (u, z) => female(u, z)),
  ];

  const { mesh } = stitchTube(all, segmentsU, 'ring');
  return { mesh, manifold: checkManifold(mesh), height };
}

/**
 * STEM - a riser segment: male below, female above, so segments stack to any
 * height. The cable runs up the bore.
 */
export function buildStem({ length = 70, segmentsU = 192 } = {}) {
  const engage = KNUCKLE.pitch * KNUCKLE.turns;
  const male = maleThreadField({ spec: KNUCKLE, startZ: 0, length: engage, taper: 0.6 });
  const female = femaleThreadField({ spec: KNUCKLE, startZ: length - engage, length: engage, taper: 0.6 });
  const shell = HARDWARE.stemOuter;
  const core = KNUCKLE.majorDiameter / 2 - KNUCKLE.depth;
  const bore = core - 3.2;
  const femaleCore = KNUCKLE.majorDiameter / 2 - KNUCKLE.depth + KNUCKLE.clearance;
  const skirt = cone(engage, core, shell);

  const all = [
    // Male spigot at the bottom.
    ...rows(0, engage, 60, (u, z) => male(u, z), () => bore),
    ...rows(engage, skirt.z1, 6, (u, z) => skirt.r(z), () => bore),
    // Plain waist.
    ...rows(skirt.z1, length - engage - femaleCore + bore, 4, () => shell, () => bore),
    // 45-degree chamfer up into the thread: an annular ledge here would be a
    // bridge, and a bridge inside a threaded socket is where blobs collect.
    ...rows(length - engage - femaleCore + bore, length - engage, 6, () => shell,
      (u, z) => bore + (z - (length - engage - femaleCore + bore))),
    // Female socket at the top.
    ...rows(length - engage, length, 60, () => shell, (u, z) => female(u, z)),
  ];

  const { mesh } = stitchTube(all, segmentsU, 'stem');
  return { mesh, manifold: checkManifold(mesh), length };
}

/**
 * BASE - the foot. Heavy where it should be (at the floor) and hollow above, so
 * you can pour sand in through the top before screwing the stem down.
 *
 * The outer skirt's radius only ever decreases with height, so none of it is an
 * overhang. The cavity ceiling does face downward, so it is a 45-degree cone.
 */
export function buildBase({
  radius = 62,
  height = 24,
  shoulder = 20,
  cavity = 28,
  floor = 3,
  segmentsU = 256,
  cableRadius = 4,
} = {}) {
  const engage = KNUCKLE.pitch * KNUCKLE.turns;
  const threadZ = height - engage;
  const female = femaleThreadField({ spec: KNUCKLE, startZ: threadZ, length: engage, taper: 0.6 });
  const femaleCore = KNUCKLE.majorDiameter / 2 - KNUCKLE.depth + KNUCKLE.clearance;
  const boss = HARDWARE.stemOuter + 4;

  // Quarter-ellipse skirt down to the boss, then parallel to the top.
  const skirt = (z) => {
    if (z >= shoulder) return boss;
    const t = z / shoulder;
    return boss + (radius - boss) * Math.sqrt(Math.max(0, 1 - t * t));
  };

  // The cable notch: a local dip in the outer wall at one angle, at floor level.
  // Its ceiling tapers back out rather than bridging, so it needs no support.
  const notchHeight = 8;
  const notchDepth = cableRadius * 1.5;
  const notch = (u, z) => {
    const outerR = skirt(z);
    if (z >= notchHeight || Math.cos(u * TAU) < 0.985) return outerR;
    return outerR - notchDepth * (1 - z / notchHeight);
  };

  const ceiling = cone(floor + 2, cavity, femaleCore);  // 45 degrees, self-supporting

  const all = [
    // Solid floor: this is the mass that stops the lamp tipping.
    ...rows(0, floor, 3, (u, z) => notch(u, z), () => 0.001),
    { z: floor, outer: (u) => notch(u, floor), inner: () => cavity },
    // The sand cavity.
    ...rows(floor, floor + 2, 2, (u, z) => notch(u, z), () => cavity),
    ...rows(floor + 2, ceiling.z1, 20, (u, z) => notch(u, z), (u, z) => ceiling.r(z)),
    ...rows(ceiling.z1, threadZ, 3, (u, z) => skirt(z), () => femaleCore),
    // Female KNUCKLE-40: the stem screws in here and closes the cavity.
    ...rows(threadZ, height, 60, (u, z) => skirt(z), (u, z) => female(u, z)),
  ];

  const { mesh } = stitchTube(all, segmentsU, 'base');
  return { mesh, manifold: checkManifold(mesh), radius, height };
}

/**
 * COUPON - thread stubs for both sizes on one small part. Print this first. It
 * takes a few minutes and tells you whether your printer's tolerances suit the
 * clearance before you commit two hours to a shade.
 */
export function buildCoupon({ segmentsU = 160 } = {}) {
  const knuckleLength = KNUCKLE.pitch * 2;
  const petalLength = PETAL.pitch * 2;
  const male = maleThreadField({ spec: KNUCKLE, startZ: 2, length: knuckleLength, taper: 0.5 });
  const female = femaleThreadField({ spec: PETAL, startZ: 2, length: petalLength, taper: 0.5 });
  const outer = PETAL.majorDiameter / 2 + 3.2;
  const top = 2 + Math.max(knuckleLength, petalLength);

  // One part, two tests: a KNUCKLE-40 male post standing inside a PETAL-56
  // female bore. Screw a stem onto the post and a collar into the bore.
  const all = [
    ...rows(0, 2, 2, () => outer, () => 0.001),
    { z: 2, outer: () => outer, inner: (u) => female(u, 2) },
    ...rows(2, top, 60, () => outer, (u, z) => female(u, z)),
  ];
  const { mesh } = stitchTube(all, segmentsU, 'coupon');

  // The matching male post, printed alongside on the same bed.
  const post = stitchTube(
    [
      ...rows(0, 2, 2, () => KNUCKLE.majorDiameter / 2 - KNUCKLE.depth, () => 0.001),
      ...rows(2, 2 + knuckleLength, 50, (u, z) => male(u, z), () => 0.001),
    ],
    segmentsU,
    'coupon-post'
  );
  post.mesh.translate(PETAL.majorDiameter / 2 + KNUCKLE.majorDiameter / 2 + 12, 0, 0);
  mesh.merge(post.mesh);

  return { mesh, manifold: checkManifold(mesh) };
}

export const HARDWARE_PARTS = {
  collar: buildCollar,
  ring: buildRing,
  stem: buildStem,
  base: buildBase,
  coupon: buildCoupon,
};
