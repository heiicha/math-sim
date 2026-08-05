// Lines and planes in 3D, and every relationship between them that H2 vectors covers.
// Reuses the existing vector primitives (dot, cross, magnitude, ...) from vectorMath.js
// so the underlying arithmetic stays identical to the 2D/free-vector page.
import { dot, crossProduct, magnitude, add, toDegrees } from "../vectorcomponents/vectorMath.js";

const EPS = 1e-6;

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
}

export function scale(v, s) {
  return { x: v.x * s, y: v.y * s, z: (v.z || 0) * s };
}

export function normalize(v) {
  const m = magnitude(v);
  if (m < EPS) return { x: 0, y: 0, z: 0 };
  return { x: v.x / m, y: v.y / m, z: (v.z || 0) / m };
}

export function pointOnLine(line, lambda) {
  return add(line.point, scale(line.direction, lambda));
}

// Any two vectors spanning the plane, perpendicular to its normal — used
// for the parametric vector form r = a + λm1 + μm2, and for drawing a
// finite patch of the plane in the 3D scene.
export function spanningVectors(normal) {
  const n = normalize(normal);
  const reference = Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const m1 = normalize(crossProduct(n, reference));
  const m2 = normalize(crossProduct(n, m1));
  return { m1, m2 };
}

export function reflectPointAcrossPlane(point, plane) {
  const diff = subtract(point, plane.point);
  const nMagSq = dot(plane.normal, plane.normal);
  if (nMagSq < EPS) return point;
  const s = (2 * dot(diff, plane.normal)) / nMagSq;
  return subtract(point, scale(plane.normal, s));
}

// Reflects a free vector (no position, e.g. a direction or normal) across a
// plane's normal — same formula as reflectPointAcrossPlane but without the
// point-plane.point translation, since a direction has no position to
// measure that offset from.
export function reflectVectorAcrossPlane(v, plane) {
  const n = plane.normal;
  const nMagSq = dot(n, n);
  if (nMagSq < EPS) return v;
  const s = (2 * dot(v, n)) / nMagSq;
  return subtract(v, scale(n, s));
}

export function reflectLineAcrossPlane(line, mirror) {
  return {
    point: reflectPointAcrossPlane(line.point, mirror),
    direction: reflectVectorAcrossPlane(line.direction, mirror),
  };
}

export function reflectPlaneAcrossPlane(plane, mirror) {
  return {
    point: reflectPointAcrossPlane(plane.point, mirror),
    normal: reflectVectorAcrossPlane(plane.normal, mirror),
  };
}

// ---- Line & Plane -------------------------------------------------------

export function linePlaneRelationship(line, plane) {
  const d = line.direction;
  const n = plane.normal;
  const dDotN = dot(d, n);
  const dMag = magnitude(d);
  const nMag = magnitude(n);
  const diff = subtract(line.point, plane.point);

  if (dMag < EPS || nMag < EPS) {
    return { type: "degenerate" };
  }

  if (Math.abs(dDotN) < EPS * dMag * nMag) {
    // direction is perpendicular to the normal -> line is flat against the plane
    const signedDist = dot(diff, n) / nMag;
    if (Math.abs(signedDist) < EPS) {
      return { type: "contained", angleDeg: 0 };
    }
    return { type: "parallel", distance: Math.abs(signedDist), angleDeg: 0 };
  }

  const lambda = -dot(diff, n) / dDotN;
  const point = pointOnLine(line, lambda);
  const angleRad = Math.asin(Math.min(1, Math.abs(dDotN) / (dMag * nMag)));
  return { type: "intersecting", point, lambda, angleDeg: toDegrees(angleRad) };
}

// ---- Line & Line ----------------------------------------------------------

export function lineLineRelationship(line1, line2) {
  const d1 = line1.direction;
  const d2 = line2.direction;
  const mag1 = magnitude(d1);
  const mag2 = magnitude(d2);
  if (mag1 < EPS || mag2 < EPS) return { type: "degenerate" };

  const cross = crossProduct(d1, d2);
  const crossMag = magnitude(cross);
  const diff = subtract(line2.point, line1.point);
  const angleRad = Math.acos(Math.min(1, Math.abs(dot(d1, d2)) / (mag1 * mag2)));
  const angleDeg = toDegrees(angleRad);

  if (crossMag < EPS * mag1 * mag2) {
    // directions parallel — same line, or parallel & distinct
    const distance = magnitude(crossProduct(diff, d1)) / mag1;
    if (distance < EPS) return { type: "same" };
    return { type: "parallel", distance, angleDeg: 0 };
  }

  const scalarTriple = dot(diff, cross);
  const coplanar = Math.abs(scalarTriple) < EPS * (mag1 * mag2 * magnitude(diff) + 1);

  if (coplanar) {
    const lambda = dot(crossProduct(diff, d2), cross) / (crossMag * crossMag);
    const point = pointOnLine(line1, lambda);
    // parameter of the same point along line2, so callers can size line2's
    // drawn segment to reach it too (point lies exactly on line2 here)
    const lambda2 = dot(subtract(point, line2.point), d2) / dot(d2, d2);
    return { type: "intersecting", point, lambda, lambda2, angleDeg };
  }

  const distance = Math.abs(scalarTriple) / crossMag;
  return { type: "skew", angleDeg, distance, commonPerpendicular: normalize(cross) };
}

// The two points — one on each line — where the shortest connecting
// segment between two skew lines meets them. Returns null if the lines
// aren't actually skew (parallel directions have no unique closest pair).
export function closestPointsOnSkewLines(line1, line2) {
  const d1 = line1.direction;
  const d2 = line2.direction;
  const w0 = subtract(line1.point, line2.point);
  const a = dot(d1, d1);
  const b = dot(d1, d2);
  const c = dot(d2, d2);
  const dVal = dot(d1, w0);
  const e = dot(d2, w0);
  const denom = a * c - b * b;
  if (Math.abs(denom) < EPS) return null;

  const s = (b * e - c * dVal) / denom;
  const t = (a * e - b * dVal) / denom;
  return {
    P1: pointOnLine(line1, s),
    P2: pointOnLine(line2, t),
  };
}

// ---- Plane & Plane ----------------------------------------------------------

export function planePlaneRelationship(plane1, plane2) {
  const n1 = plane1.normal;
  const n2 = plane2.normal;
  const mag1 = magnitude(n1);
  const mag2 = magnitude(n2);
  if (mag1 < EPS || mag2 < EPS) return { type: "degenerate" };

  const cross = crossProduct(n1, n2);
  const crossMag = magnitude(cross);
  const angleRad = Math.acos(Math.min(1, Math.abs(dot(n1, n2)) / (mag1 * mag2)));
  const angleDeg = toDegrees(angleRad);

  if (crossMag < EPS * mag1 * mag2) {
    const diff = subtract(plane2.point, plane1.point);
    const distance = Math.abs(dot(diff, n1)) / mag1;
    if (distance < EPS) return { type: "same", angleDeg: 0 };
    return { type: "parallel", distance, angleDeg: 0 };
  }

  // Solve for a point on the intersection line by writing it as
  // r = alpha*n1 + beta*n2 (always possible when n1, n2 aren't parallel)
  // and matching both plane equations n_i . r = n_i . a_i.
  const k1 = dot(n1, plane1.point);
  const k2 = dot(n2, plane2.point);
  const n1n1 = dot(n1, n1);
  const n2n2 = dot(n2, n2);
  const n1n2 = dot(n1, n2);
  const det = n1n1 * n2n2 - n1n2 * n1n2; // = crossMag^2, guaranteed nonzero here

  const alpha = (k1 * n2n2 - k2 * n1n2) / det;
  const beta = (k2 * n1n1 - k1 * n1n2) / det;
  const point = add(scale(n1, alpha), scale(n2, beta));

  return {
    type: "intersecting",
    angleDeg,
    line: { point, direction: normalize(cross) },
  };
}

// ---- Point & Line -----------------------------------------------------

// Foot of the perpendicular, N, from a point to the line r = a + λm — via
// vector projection: AP = P - A, AN = (AP . m / m . m) m, N = A + AN.
export function footOfPerpendicularToLine(point, line) {
  const m = line.direction;
  const mMagSq = dot(m, m);
  if (mMagSq < EPS) return null;
  const AP = subtract(point, line.point);
  const t = dot(AP, m) / mMagSq;
  return add(line.point, scale(m, t));
}

export function pointLineRelationship(point, line) {
  const foot = footOfPerpendicularToLine(point, line);
  if (!foot) return { type: "degenerate" };
  return { type: "foot", foot, distance: magnitude(subtract(point, foot)) };
}

// Reflection of a point in a line: N is the midpoint of P and its
// reflection P', so P' = 2N - P (Ratio Theorem with λ = μ).
export function reflectPointAcrossLine(point, line) {
  const foot = footOfPerpendicularToLine(point, line);
  if (!foot) return point;
  return subtract(scale(foot, 2), point);
}

// ---- Point & Plane ------------------------------------------------------

// Foot of the perpendicular, N, from a point to the plane r . n = D — via
// vector projection: QA = A - Q (A any point on the plane), QN = (QA . n̂) n̂.
export function footOfPerpendicularToPlane(point, plane) {
  const n = plane.normal;
  const nMagSq = dot(n, n);
  if (nMagSq < EPS) return null;
  const QA = subtract(plane.point, point);
  const t = dot(QA, n) / nMagSq;
  return add(point, scale(n, t));
}

export function pointPlaneRelationship(point, plane) {
  const foot = footOfPerpendicularToPlane(point, plane);
  if (!foot) return { type: "degenerate" };
  return { type: "foot", foot, distance: magnitude(subtract(point, foot)) };
}

// ---- Cartesian equation formatting ----------------------------------------

// Splits a line's axes into "free" ones (nonzero direction component, part
// of the x=y=z ratio chain) and "fixed" ones (zero direction component,
// meaning that coordinate never changes — its own standalone equation).
export function cartesianLineParts(line) {
  const axes = [
    { label: "x", a: line.point.x, d: line.direction.x },
    { label: "y", a: line.point.y, d: line.direction.y },
    { label: "z", a: line.point.z || 0, d: line.direction.z || 0 },
  ];
  const free = axes.filter((ax) => Math.abs(ax.d) > EPS);
  const fixed = axes.filter((ax) => Math.abs(ax.d) <= EPS);
  return { free, fixed };
}

export function cartesianPlaneEquation(plane) {
  const n = plane.normal;
  const d = dot(n, plane.point);
  return { n, d };
}
