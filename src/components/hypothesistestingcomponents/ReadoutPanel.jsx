import { DEFINITIONS, H1_POSSIBILITIES } from "./definitions";
import { tailWords } from "./hypothesisMath";
import { fmt } from "../../utils/statsMath";

function Condition({ label = "From the notes", children }) {
  return (
    <p className="condition">
      <span className="condition-label">{label}</span>
      {children}
    </p>
  );
}

function FormulateReadout({ values }) {
  return (
    <>
      <p className="readout-def">{DEFINITIONS.hypothesis}</p>
      <p className="readout-def">{DEFINITIONS.testing}</p>
      <p className="readout-def">{DEFINITIONS.h0}</p>
      <p className="readout-def">{DEFINITIONS.h1}</p>
      <Condition label="The 3 possibilities for H₁">
        {H1_POSSIBILITIES.map((p) => `μ ${p.symbol} μ₀ (${p.meaning})`).join("  ·  ")}
      </Condition>
      <div className="result-row is-highlighted">
        <span>In words</span>
        <strong style={{ fontFamily: "var(--font-body)", fontWeight: 400, textAlign: "right" }}>
          H₁ claims {tailWords(values.tail, fmt(values.mu0, 2))}
        </strong>
      </div>
    </>
  );
}

function RunReadout({ values, test }) {
  if (!test) {
    return <p className="note">Enter a valid sample mean, sample size and standard deviation to see the working.</p>;
  }

  const alphaFrac = values.alphaPct / 100;
  const critLabel =
    test.tail === "two"
      ? `z ≤ ${fmt(test.criticalValues[0], 3)} or z ≥ ${fmt(test.criticalValues[1], 3)}`
      : test.tail === "less"
        ? `z ≤ ${fmt(test.criticalValues[0], 3)}`
        : `z ≥ ${fmt(test.criticalValues[0], 3)}`;

  return (
    <>
      <p className="readout-def">{DEFINITIONS.significance}</p>
      <p className="readout-def">{DEFINITIONS.testStatistic}</p>

      <p className="formula">
        Under H₀, X̄ ~ N(μ₀, {values.varianceKnown ? "σ²" : "s²"}/n), so Z = (X̄ − μ₀) / (
        {values.varianceKnown ? "σ" : "s"}/√n) ~ N(0,1){values.varianceKnown && values.isNormal ? "" : " approximately"}.
      </p>

      <div className="result-row is-highlighted">
        <span>Test statistic, z</span>
        <strong>{fmt(test.z, 4)}</strong>
      </div>

      <p className="readout-def">{DEFINITIONS.criticalRegion}</p>
      <div className="result-row">
        <span>Critical region ({values.alphaPct}% level, {test.tail === "two" ? "two-tailed" : "one-tailed"})</span>
        <strong>{critLabel}</strong>
      </div>

      <p className="readout-def">{DEFINITIONS.pValue}</p>
      <div className="result-row is-highlighted">
        <span>p-value</span>
        <strong>{fmt(test.pValue, 4)}</strong>
      </div>

      <div className="result-row">
        <span>Method 1: test statistic vs. critical region</span>
        <strong>{test.reject ? "z falls in critical region" : "z falls outside critical region"}</strong>
      </div>
      <div className="result-row">
        <span>Method 2: p-value vs. α</span>
        <strong>
          {fmt(test.pValue, 4)} {test.pValue <= alphaFrac ? "≤" : ">"} {alphaFrac}
        </strong>
      </div>

      <div className="result-row is-highlighted">
        <span className={`stat-pill ${test.reject ? "is-positive" : "is-negative"}`}>
          {test.reject ? "Reject H₀" : "Do not reject H₀"}
        </span>
        <strong style={{ fontFamily: "var(--font-body)", fontWeight: 400, textAlign: "right", maxWidth: "60%" }}>
          There is {test.reject ? "sufficient" : "insufficient"} evidence, at the {values.alphaPct}% level of
          significance, to conclude that {tailWords(values.tail, fmt(values.mu0, 2))}.
        </strong>
      </div>
    </>
  );
}

function CaseReadout({ values }) {
  const nLarge = values.n >= 30;
  // Matches DecisionTable.jsx: the two "NOT IN SYLLABUS" cells are both
  // under sigma^2 unknown + small n (normality doesn't rescue that case —
  // Case 2 needs the CLT, which needs a large sample).
  const inSyllabus = values.varianceKnown || nLarge;
  return (
    <>
      <p className="readout-def">
        For an A-Level H2 syllabus, only the z-test on a population mean μ is examinable. Whether it
        applies — and which version of Z you use — depends on three facts: is X normally
        distributed, is σ² known, and is the sample large (n ≥ 30)?
      </p>
      <div className="result-row is-highlighted">
        <span>Current scenario</span>
        <strong>
          {values.isNormal ? "X normal" : "X not given normal"}, σ² {values.varianceKnown ? "known" : "unknown"}, n
          {" "}
          {nLarge ? "≥ 30 (large)" : "< 30 (small)"}
        </strong>
      </div>
      <Condition>
        {inSyllabus
          ? "This combination is examinable — see the highlighted cell in the table for the exact distribution of Z."
          : "This combination is NOT IN SYLLABUS: with σ² unknown, a small sample and no normality assumption, there isn't enough to justify a z-test at this level."}
      </Condition>
    </>
  );
}

export default function ReadoutPanel({ mode, values, test }) {
  return (
    <aside className="panel readout-panel">
      <p className="readout-eyebrow">Results</p>
      {mode === "formulate" && <FormulateReadout values={values} />}
      {mode === "run" && <RunReadout values={values} test={test} />}
      {mode === "cases" && <CaseReadout values={values} />}
    </aside>
  );
}
