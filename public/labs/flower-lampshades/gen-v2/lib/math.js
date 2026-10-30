// Small maths helpers. No dependencies: this file runs in Node and in the browser.

export const TAU = Math.PI * 2;

export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Blend two plain objects of numbers component-wise. Used to morph a cross-section up the shade. */
export function lerpParams(a, b, t) {
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const av = a[key] ?? b[key];
    const bv = b[key] ?? a[key];
    out[key] = typeof av === 'number' && typeof bv === 'number' ? lerp(av, bv, t) : bv;
  }
  return out;
}

/**
 * Gielis superformula: one equation, a whole catalogue of flower cross-sections.
 *
 *   r(theta) = ( |cos(m*theta/4)/a|^n2 + |sin(m*theta/4)/b|^n3 ) ^ (-1/n1)
 *
 * m  petal count (m=6 -> six lobes)
 * n1 overall "puffiness"; small n1 -> pinched star, large n1 -> rounded polygon
 * n2 sharpness of the petal tips
 * n3 sharpness of the valleys between petals
 *
 * Returns an un-normalised radius. Callers normalise per cross-section so the
 * silhouette curve stays the single source of truth for actual size.
 */
export function superformula(theta, { m = 6, n1 = 1, n2 = 1, n3 = 1, a = 1, b = 1 }) {
  const t = (m * theta) / 4;
  const p1 = Math.pow(Math.abs(Math.cos(t) / a), n2);
  const p2 = Math.pow(Math.abs(Math.sin(t) / b), n3);
  const sum = p1 + p2;
  if (sum <= 0) return 0;
  const r = Math.pow(sum, -1 / n1);
  return Number.isFinite(r) ? r : 0;
}

/** Peak radius of a superformula section, sampled densely enough to be stable. */
export function superformulaPeak(params, samples = 720) {
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    const r = superformula((i / samples) * TAU, params);
    if (r > peak) peak = r;
  }
  return peak || 1;
}

/**
 * Monotone cubic interpolation (Fritsch-Carlson) through control points.
 *
 * Chosen over Catmull-Rom on purpose: a plain spline overshoots between points,
 * and an overshoot in a lamp silhouette is a bulge the printer cannot reach past.
 * This one never invents a bump that is not in the control points.
 *
 * @param {Array<[number, number]>} points [[x, y], ...] sorted by x
 * @returns {(x: number) => number}
 */
export function monotoneSpline(points) {
  const pts = [...points].sort((p, q) => p[0] - q[0]);
  const n = pts.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => pts[0][1];

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    slope.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }

  const m = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m[i] = 0;
    else m[i] = (slope[i - 1] + slope[i]) / 2;
  }
  // Fritsch-Carlson limiter: keeps every segment monotone.
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * slope[i];
      m[i + 1] = t * b * slope[i];
    }
  }

  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    let hi = n - 1;
    while (hi - i > 1) {
      const mid = (i + hi) >> 1;
      if (xs[mid] <= x) i = mid;
      else hi = mid;
    }
    const h = dx[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      ys[i] * (2 * t3 - 3 * t2 + 1) +
      m[i] * h * (t3 - 2 * t2 + t) +
      ys[i + 1] * (-2 * t3 + 3 * t2) +
      m[i + 1] * h * (t3 - t2)
    );
  };
}
