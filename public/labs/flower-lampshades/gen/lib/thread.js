// Printed threads.
//
// A thread is just a radius that depends on angle AND height, so it reuses the
// same radial-surface mesher as the shades. No sweeps, no booleans.
//
// The profile is trapezoidal, not V-shaped: a flat crest prints cleanly with a
// 0.4 mm nozzle, and a blunt flank is far more tolerant of the elephant's foot
// on the first turns than a knife edge would be.

import { clamp } from './math.js';

/**
 * Two sizes, because they do two different jobs.
 *
 * KNUCKLE-40 is the structural joint: base to stem to stem to collar. It runs up
 * the inside of the lamp where nothing else competes for space.
 *
 * PETAL-56 is the shade clamp. It has to be larger than KNUCKLE-40 for a
 * physical reason: it lives on a collar that cups OVER the E27 lampholder, and a
 * lampholder body is about 40 mm across. A 40 mm thread could not clear it.
 */
export const THREADS = {
  'KNUCKLE-40': {
    name: 'KNUCKLE-40',
    majorDiameter: 40,
    pitch: 4,
    depth: 1.2,
    flank: 0.28,
    clearance: 0.35,
    turns: 2.5,
  },
  'PETAL-56': {
    name: 'PETAL-56',
    majorDiameter: 56,
    pitch: 4,
    depth: 1.2,
    flank: 0.28,
    clearance: 0.35,
    turns: 3,
  },
};

export const KNUCKLE = THREADS['KNUCKLE-40'];
export const PETAL = THREADS['PETAL-56'];

/** Trapezoidal profile over one pitch. phase in [0,1) -> 0 at root, 1 at crest. */
export function threadProfile(phase, flank = KNUCKLE.flank) {
  const t = phase - Math.floor(phase);
  const crest = 0.5 - flank;
  if (t < flank) return t / flank;
  if (t < flank + crest) return 1;
  if (t < 2 * flank + crest) return 1 - (t - flank - crest) / flank;
  return 0;
}

/**
 * Radius field for a helical thread.
 *
 * @param {object} options
 * @param {object} options.spec     one of THREADS
 * @param {number} options.startZ   where the thread begins
 * @param {number} options.length   axial length of the threaded section
 * @param {boolean} options.female  true adds the clearance
 */
export function threadField({ spec, startZ, length, taper = 1.2, female = false }) {
  const core = spec.majorDiameter / 2 - spec.depth + (female ? spec.clearance : 0);
  return (u, z) => {
    if (z < startZ || z > startZ + length) return core;
    // The helix: height and angle advance together.
    const phase = (z - u * spec.pitch) / spec.pitch;
    let h = threadProfile(phase, spec.flank);
    // Fade the first and last turn in, so there is no sharp lead-in edge to
    // catch and no unsupported ledge on the very first layer.
    const inRamp = clamp((z - startZ) / taper / spec.pitch, 0, 1);
    const outRamp = clamp((startZ + length - z) / taper / spec.pitch, 0, 1);
    return core + spec.depth * h * Math.min(inRamp, outRamp);
  };
}

export const maleThreadField = (options) => threadField({ ...options, female: false });
export const femaleThreadField = (options) => threadField({ ...options, female: true });

/** Smallest radius a female thread reaches, i.e. what the male must clear. */
export const femaleCrest = (spec) => spec.majorDiameter / 2 - spec.depth + spec.clearance;
/** A plain bore that clears a male thread of this size without touching it. */
export const clearanceBore = (spec) => spec.majorDiameter / 2 + spec.clearance + 0.35;
