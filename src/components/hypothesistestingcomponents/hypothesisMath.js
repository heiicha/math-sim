// Hypothesis-testing specific math (test statistic, critical value(s),
// p-value) built on top of the shared normal-distribution primitives in
// src/utils/statsMath.js. All z-tests on a population mean, per §2-§4 of the
// notes (2MA_19N_HypothesisTesting.pdf).
import { normalCDF, invNormalStandard } from "../../utils/statsMath";

export const TAIL_OPTIONS = [
  { value: "less", symbol: "<", label: "μ < μ₀", hint: "definite decrease" },
  { value: "greater", symbol: ">", label: "μ > μ₀", hint: "definite increase" },
  { value: "two", symbol: "≠", label: "μ ≠ μ₀", hint: "a change" },
];

export function tailWords(tail, mu0) {
  if (tail === "less") return `the population mean is less than ${mu0}`;
  if (tail === "greater") return `the population mean is more than ${mu0}`;
  return `the population mean differs from ${mu0}`;
}

// z = (xbar - mu0) / (sigmaOrS / sqrt(n)); critical value(s) and p-value
// depend on the tail of H1 (Definition 2.7 critical region, Definition 2.8
// p-value). Returns null when inputs aren't usable yet.
export function computeTest({ mu0, tail, xbar, n, sigmaOrS, alpha }) {
  if (![mu0, xbar, n, sigmaOrS, alpha].every(Number.isFinite) || n <= 0 || sigmaOrS <= 0 || alpha <= 0 || alpha >= 1) {
    return null;
  }
  const se = sigmaOrS / Math.sqrt(n);
  const z = (xbar - mu0) / se;

  let pValue;
  let criticalValues;
  let reject;

  if (tail === "less") {
    // invNormalStandard(alpha) is already negative for alpha < 0.5 — it's
    // the z with P(Z <= z) = alpha, exactly the lower-tail critical value.
    pValue = normalCDF(z);
    const cv = invNormalStandard(alpha);
    criticalValues = [cv];
    reject = z <= cv;
  } else if (tail === "greater") {
    // Mirror image: the upper-tail critical value is the z with
    // P(Z <= z) = 1 - alpha, i.e. invNormalStandard(1 - alpha) (positive).
    pValue = 1 - normalCDF(z);
    const cv = invNormalStandard(1 - alpha);
    criticalValues = [cv];
    reject = z >= cv;
  } else {
    pValue = 2 * (1 - normalCDF(Math.abs(z)));
    const cv = invNormalStandard(1 - alpha / 2);
    criticalValues = [-cv, cv];
    reject = Math.abs(z) >= cv;
  }

  return { z, se, pValue, criticalValues, reject, tail };
}

// The regions to shade under the standard normal curve for a given tail /
// critical value set — used for both the critical-region and p-value views.
export function criticalRegions(tail, criticalValues, domainEdge = 4.5) {
  if (tail === "less") return [{ from: -domainEdge, to: criticalValues[0] }];
  if (tail === "greater") return [{ from: criticalValues[0], to: domainEdge }];
  return [
    { from: -domainEdge, to: criticalValues[0] },
    { from: criticalValues[1], to: domainEdge },
  ];
}

export function pValueRegions(tail, z, domainEdge = 4.5) {
  if (tail === "less") return [{ from: -domainEdge, to: z }];
  if (tail === "greater") return [{ from: z, to: domainEdge }];
  return [
    { from: -domainEdge, to: -Math.abs(z) },
    { from: Math.abs(z), to: domainEdge },
  ];
}
