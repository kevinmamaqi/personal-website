// Closed planar curves.
//
// The generator used to describe every cross-section as a radius field r(theta),
// which made two things free: the wall offset was just `r - wall`, and a
// positive radius was a proof that the printed loop could not cross itself.
// A grown curve gives up both - it is not single-valued in theta - so the
// guarantees have to be earned explicitly here instead.

/** Twice the signed area. Positive means counter-clockwise. */
export function signedArea2(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    sum += x0 * y1 - x1 * y0;
  }
  return sum;
}

/** Force counter-clockwise winding, so "inward" is unambiguous downstream. */
export function toCCW(points) {
  return signedArea2(points) < 0 ? [...points].reverse() : points;
}

export function perimeter(points) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    total += Math.hypot(x1 - x0, y1 - y0);
  }
  return total;
}

export function peakRadius(points) {
  let peak = 0;
  for (const [x, y] of points) {
    const d = Math.hypot(x, y);
    if (d > peak) peak = d;
  }
  return peak;
}

/**
 * Offset a counter-clockwise closed curve inward by `distance`.
 *
 * Along the curve normal, not radially: at a ruffle the fold points back toward
 * the axis, and a radial offset there would push the inner wall *through* the
 * outer one. The normal is taken from the chord between the two neighbours,
 * which is stabler on a polyline than differencing a single edge.
 */
export function offsetInward(points, distance) {
  const n = points.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const [px, py] = points[(i - 1 + n) % n];
    const [nx2, ny2] = points[(i + 1) % n];
    const tx = nx2 - px;
    const ty = ny2 - py;
    const len = Math.hypot(tx, ty) || 1e-9;
    // Counter-clockwise winding puts the interior to the *left* of the tangent,
    // so the inward normal is the left-hand one, (-ty, tx).
    const ix = -ty / len;
    const iy = tx / len;
    const [x, y] = points[i];
    out[i] = [x + ix * distance, y + iy * distance];
  }
  return out;
}

/**
 * Smallest distance between two parts of the curve that are close in space but
 * far apart *along* the curve - that is, places where it folds back on itself.
 *
 * The naive version of this, "nearest point more than k indices away", measures
 * nothing useful: on any smooth convex curve the answer is always the chord
 * across those k indices, so every shade reported the same number and a real
 * fold would have been invisible behind it. What distinguishes a fold is the
 * ratio: two walls 1 mm apart in space but 50 mm apart along the path are a
 * fold, while two points 1 mm apart and 1 mm along the path are just the curve.
 *
 * Returns Infinity when the curve never doubles back, which is the honest
 * answer for anything convex.
 */
export function minSelfDistance(points, foldRatio = 10) {
  const n = points.length;
  if (n < 8) return Infinity;

  const arc = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    arc[i + 1] = arc[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const total = arc[n];

  // A fold can only be tighter than the cell size if the cell size is at least
  // the spacing between points, so scale the grid to the curve.
  const cell = Math.max(total / n, 1e-9) * 8;
  const grid = new Map();
  for (let i = 0; i < n; i++) {
    const key = `${Math.floor(points[i][0] / cell)},${Math.floor(points[i][1] / cell)}`;
    let bucket = grid.get(key);
    if (!bucket) grid.set(key, (bucket = []));
    bucket.push(i);
  }

  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(points[i][0] / cell);
    const cy = Math.floor(points[i][1] / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const bucket = grid.get(`${gx},${gy}`);
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue;
          const along = Math.min(arc[j] - arc[i], total - (arc[j] - arc[i]));
          const d = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]);
          if (d === 0) return 0;
          if (along < foldRatio * d) continue; // just the curve running along itself
          if (d < best) best = d;
        }
      }
    }
  }
  return best;
}

/**
 * Tightest *convex* turn on the curve, as a radius in millimetres.
 *
 * The inner wall is the outer one pushed in by a line width. On a convex turn
 * that offset tightens the curve - a circle of radius R becomes one of R−w - so
 * where the curve turns tighter than the wall is thick, the offset folds through
 * itself and the shell stops being a shell. Concave turns are the opposite case:
 * offsetting inward opens them out, so they are not the constraint and counting
 * them would reject shapes that print perfectly well.
 *
 * Assumes counter-clockwise winding, where a left turn is convex.
 */
export function minConvexTurnRadius(points) {
  const n = points.length;
  let smallest = Infinity;
  for (let i = 0; i < n; i++) {
    const a = points[(i - 1 + n) % n];
    const b = points[i];
    const c = points[(i + 1) % n];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross <= 0) continue; // right turn: concave, and offsetting opens it up
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const ca = Math.hypot(a[0] - c[0], a[1] - c[1]);
    // Circumradius of the three points: R = abc / 4A, and 2A is |cross|.
    const radius = (ab * bc * ca) / (2 * Math.abs(cross));
    if (radius < smallest) smallest = radius;
  }
  return smallest;
}

/** Distance from a point to a line segment. */
function pointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/**
 * Largest horizontal step from one layer to the next: for every point on this
 * layer, how far it sits from the *path* of the layer below.
 *
 * Two things here are deliberate. It measures against the previous contour as a
 * polyline rather than as a set of points, and it measures to the nearest part
 * of it rather than to the correspondingly-indexed point.
 *
 * The nearest-part half is because grown layers do not share a parameterisation:
 * the curve is resampled by arc length, so the points drift along it and an
 * index-to-index difference measures the drift rather than the overhang. The
 * polyline half is because point-to-point still charges up to half a sample
 * spacing for that drift - on a 256-point Ø68 throat that is 0.42 mm, which
 * against a 0.28 mm layer reads as a 56 degree overhang on a shade that is
 * perfectly cylindrical. Both halves are needed; with either one missing the
 * number is dominated by sampling rather than by shape.
 */
export function maxStepToPrevious(points, previous) {
  if (!previous || previous.length < 2) return 0;
  const n = previous.length;
  const cell = Math.max(perimeter(previous) / n, 1e-9) * 4;
  const grid = new Map();
  for (let i = 0; i < n; i++) {
    const key = `${Math.floor(previous[i][0] / cell)},${Math.floor(previous[i][1] / cell)}`;
    let bucket = grid.get(key);
    if (!bucket) grid.set(key, (bucket = []));
    bucket.push(i);
  }

  const distanceToSegmentsAt = (x, y, j) => {
    const a = previous[(j - 1 + n) % n];
    const b = previous[j];
    const c = previous[(j + 1) % n];
    return Math.min(
      pointToSegment(x, y, a[0], a[1], b[0], b[1]),
      pointToSegment(x, y, b[0], b[1], c[0], c[1])
    );
  };

  let worst = 0;
  for (const [x, y] of points) {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    let nearest = Infinity;
    for (let radius = 1; radius <= 4 && nearest === Infinity; radius++) {
      for (let gx = cx - radius; gx <= cx + radius; gx++) {
        for (let gy = cy - radius; gy <= cy + radius; gy++) {
          const bucket = grid.get(`${gx},${gy}`);
          if (!bucket) continue;
          for (const j of bucket) {
            const d = distanceToSegmentsAt(x, y, j);
            if (d < nearest) nearest = d;
          }
        }
      }
    }
    if (nearest === Infinity) {
      for (let j = 0; j < n; j++) {
        const d = distanceToSegmentsAt(x, y, j);
        if (d < nearest) nearest = d;
      }
    }
    if (nearest > worst) worst = nearest;
  }
  return worst;
}
