// Reproduces the notes' "Summary Part 1: Different Cases" table (end of
// 2MA_19N_HypothesisTesting.pdf) and highlights the cell that matches the
// scenario described by the current control-panel toggles.
const NORMAL_EXACT =
  "X̄ ~ N(μ₀, σ²/n) exactly, so Z = (X̄ − μ₀) / (σ/√n) ~ N(0,1) exactly — holds for any n. [Example 3.1, 4.1(a)]";
const NORMAL_UNKNOWN_LARGE =
  "Z = (X̄ − μ₀) / (s/√n) ~ N(0,1) approximately. [Example 4.1(b)]";
const NOT_NORMAL_KNOWN_LARGE =
  "By the Central Limit Theorem, X̄ ~ N(μ₀, σ²/n) approximately, so Z ~ N(0,1) approximately. [Example 4.4]";
const NOT_NORMAL_KNOWN_SMALL =
  "Need to assume X ~ N(μ₀, σ²); it then follows that Z = (X̄ − μ₀) / (σ/√n) ~ N(0,1). [Example 4.3]";
const NOT_NORMAL_UNKNOWN_LARGE =
  "By the Central Limit Theorem, X̄ ~ N(μ₀, s²/n) approximately, so Z ~ N(0,1) approximately. [Example 4.2]";
const NOT_IN_SYLLABUS = "NOT IN SYLLABUS";

export default function DecisionTable({ isNormal, varianceKnown, nLarge }) {
  const cell = (active, text) => (
    <td className={active ? "is-active" : ""}>{text}</td>
  );
  const th = (active, text) => (
    <th className={active ? "is-active" : ""}>{text}</th>
  );

  const knownRowActive = varianceKnown;
  const unknownRowActive = !varianceKnown;
  const normalColActive = isNormal;
  const notNormalLargeActive = !isNormal && nLarge;
  const notNormalSmallActive = !isNormal && !nLarge;

  return (
    <div className="decision-table-wrap">
      <table className="decision-table">
        <thead>
          <tr>
            <th rowSpan={2}>H₀ : μ = μ₀</th>
            <th colSpan={2} className={normalColActive ? "is-active" : ""}>
              X ~ N(μ₀, σ²)
            </th>
            <th colSpan={2} className={!isNormal ? "is-active" : ""}>
              X not given to be normal (only E(X), Var(X) known)
            </th>
          </tr>
          <tr>
            {th(normalColActive && nLarge, "Large n")}
            {th(normalColActive && !nLarge, "Small n")}
            {th(notNormalLargeActive, "Large n")}
            {th(notNormalSmallActive, "Small n")}
          </tr>
        </thead>
        <tbody>
          <tr>
            {th(knownRowActive, "σ² known")}
            <td colSpan={2} className={knownRowActive && normalColActive ? "is-active" : ""}>
              {NORMAL_EXACT}
            </td>
            {cell(knownRowActive && notNormalLargeActive, NOT_NORMAL_KNOWN_LARGE)}
            {cell(knownRowActive && notNormalSmallActive, NOT_NORMAL_KNOWN_SMALL)}
          </tr>
          <tr>
            {th(unknownRowActive, "σ² unknown")}
            {cell(unknownRowActive && normalColActive && nLarge, NORMAL_UNKNOWN_LARGE)}
            {cell(unknownRowActive && normalColActive && !nLarge, NOT_IN_SYLLABUS)}
            {cell(unknownRowActive && notNormalLargeActive, NOT_NORMAL_UNKNOWN_LARGE)}
            {cell(unknownRowActive && notNormalSmallActive, NOT_IN_SYLLABUS)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
