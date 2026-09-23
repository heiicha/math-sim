// Shared numerical helpers for the Statistics topics (Permutations &
// Combinations, Normal Distribution, Hypothesis Testing). Kept dependency
// free since the project has no math/stats library installed.

export function factorial(n) {
  if (!Number.isFinite(n) || n < 0) return NaN;
  n = Math.floor(n);
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// n! / (n-r)!, computed as a running product so it stays numerically usable
// for larger n than factorial(n) alone would (avoids forming huge
// intermediate factorials when they'd cancel out anyway).
export function nPr(n, r) {
  if (!Number.isFinite(n) || !Number.isFinite(r) || r < 0 || n < 0) return 0;
  n = Math.floor(n);
  r = Math.floor(r);
  if (r > n) return 0;
  let result = 1;
  for (let i = 0; i < r; i++) result *= n - i;
  return result;
}

// Multiplicative formula, dividing as we go to limit intermediate size.
export function nCr(n, r) {
  if (!Number.isFinite(n) || !Number.isFinite(r) || r < 0 || n < 0) return 0;
  n = Math.floor(n);
  r = Math.floor(r);
  if (r > n) return 0;
  r = Math.min(r, n - r);
  let result = 1;
  for (let i = 0; i < r; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

// n! / (n1! n2! ... nk!) via repeated nCr (choose group 1 from n, group 2
// from what's left, ...) rather than forming n! directly.
export function multinomial(n, groupSizes) {
  let remaining = n;
  let result = 1;
  for (const size of groupSizes) {
    result *= nCr(remaining, size);
    remaining -= size;
  }
  return result;
}

export function circularPermutations(n) {
  return factorial(n - 1);
}

// Abramowitz & Stegun 7.1.26, |error| <= 1.5e-7.
export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function normalPDF(x, mean = 0, sd = 1) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

export function normalCDF(x, mean = 0, sd = 1) {
  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
}

// P(a <= X <= b) for X ~ N(mean, sd^2).
export function normalRangeProbability(a, b, mean = 0, sd = 1) {
  return normalCDF(b, mean, sd) - normalCDF(a, mean, sd);
}

// Inverse CDF of the standard normal (Peter Acklam's algorithm), accurate to
// about 1.15e-9. Mirrors what a GC's invNorm does.
export function invNormalStandard(p) {
  if (!(p > 0 && p < 1)) return NaN;

  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

export function invNormal(p, mean = 0, sd = 1) {
  return mean + sd * invNormalStandard(p);
}

export function fmt(n, digits = 4) {
  if (!Number.isFinite(n)) return "—";
  if (Object.is(n, -0)) n = 0;
  const factor = 10 ** digits;
  const rounded = Math.round(n * factor) / factor;
  return String(rounded);
}
