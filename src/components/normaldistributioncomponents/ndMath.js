// Normal Distribution page-specific helpers, built on top of
// src/utils/statsMath.js. Keeps GC-flavoured formatting and the small bits
// of derived logic (empirical rule bands, bounds-mode / tail-mode
// resolution) out of the components.
import { normalRangeProbability, normalCDF, invNormal, fmt } from "../../utils/statsMath";

// P(|X-mean| <= k*sd) for k = 1, 2, 3 — the "68.3% / 95.4% / 99.7%" rule.
export function empiricalBands(mean, sd) {
  return [1, 2, 3].map((k) => ({
    k,
    label: `±${k}σ`,
    from: mean - k * sd,
    to: mean + k * sd,
    prob: normalRangeProbability(mean - k * sd, mean + k * sd, mean, sd),
  }));
}

// Resolves a normalcdf-style "bounds mode" into a probability + shading
// range + a GC-style call string.
export function boundsProbability(mode, lower, upper, mean, sd) {
  if (mode === "lower") {
    return {
      prob: normalCDF(upper, mean, sd),
      shadeFrom: -Infinity,
      shadeTo: upper,
      call: `normalcdf(-∞, ${fmt(upper, 3)}, ${fmt(mean, 3)}, ${fmt(sd, 3)})`,
    };
  }
  if (mode === "upper") {
    return {
      prob: 1 - normalCDF(lower, mean, sd),
      shadeFrom: lower,
      shadeTo: Infinity,
      call: `normalcdf(${fmt(lower, 3)}, ∞, ${fmt(mean, 3)}, ${fmt(sd, 3)})`,
    };
  }
  return {
    prob: normalRangeProbability(lower, upper, mean, sd),
    shadeFrom: lower,
    shadeTo: upper,
    call: `normalcdf(${fmt(lower, 3)}, ${fmt(upper, 3)}, ${fmt(mean, 3)}, ${fmt(sd, 3)})`,
  };
}

// Resolves an invNorm-style "tail mode" into a boundary value (or a pair,
// for the symmetric "center" case) + shading range + a GC-style call string.
export function inverseBoundary(tail, p, mean, sd) {
  if (tail === "left") {
    const a = invNormal(p, mean, sd);
    return { value: a, shadeFrom: -Infinity, shadeTo: a, call: `invNorm(${fmt(p, 4)}, ${fmt(mean, 3)}, ${fmt(sd, 3)}, LEFT) = ${fmt(a, 4)}` };
  }
  if (tail === "right") {
    const a = invNormal(1 - p, mean, sd);
    return { value: a, shadeFrom: a, shadeTo: Infinity, call: `invNorm(${fmt(p, 4)}, ${fmt(mean, 3)}, ${fmt(sd, 3)}, RIGHT) = ${fmt(a, 4)}` };
  }
  // center: P(|X - mean| <= b) = p  =>  b = invNormal((1+p)/2) - mean
  const upper = invNormal((1 + p) / 2, mean, sd);
  const b = upper - mean;
  const lower = mean - b;
  return {
    value: b,
    lower,
    upper,
    shadeFrom: lower,
    shadeTo: upper,
    call: `invNorm(${fmt((1 + p) / 2, 4)}, ${fmt(mean, 3)}, ${fmt(sd, 3)}, LEFT) = ${fmt(upper, 4)}  (b = ${fmt(b, 4)})`,
  };
}
