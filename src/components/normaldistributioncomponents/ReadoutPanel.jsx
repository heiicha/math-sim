import { empiricalBands, boundsProbability, inverseBoundary } from "./ndMath";
import { boundsSummaryLabel } from "./ProbabilityControls";
import { fmt } from "../../utils/statsMath";

function Condition({ text }) {
  if (!text) return null;
  return (
    <p className="condition">
      <span className="condition-label">From the notes</span>
      {text}
    </p>
  );
}

function CurveReadout({ mean, sd, showEmpirical }) {
  return (
    <>
      <p className="readout-def">
        A continuous random variable X whose probability density function is bell-shaped and
        symmetrical about x = &mu; is a <em>normal random variable</em>, written X ~ N(&mu;, &sigma;&sup2;)
        (Definition 2.1.1). Its mean, median and mode are all equal to &mu;, and E(X) = &mu;,
        Var(X) = &sigma;&sup2; (Result 2.1.2).
      </p>
      <p className="formula">X ~ N({fmt(mean, 2)}, {fmt(sd, 2)}&sup2;)</p>
      <div className="result-row">
        <span>As &mu; increases</span>
        <strong>curve translates in the +x direction</strong>
      </div>
      <div className="result-row is-highlighted">
        <span>As &sigma; increases</span>
        <strong>curve flattens &amp; spreads out</strong>
      </div>
      {showEmpirical && (
        <>
          <p className="readout-def" style={{ marginTop: 10 }}>
            Proportion of observations of X lying within k standard deviations of the mean
            (Example 2.5.4):
          </p>
          {empiricalBands(mean, sd).map((band) => (
            <div className="result-row" key={band.k}>
              <span>
                P(|X &minus; &mu;| &le; {band.k}&sigma;) = P({fmt(band.from, 2)} &le; X &le; {fmt(band.to, 2)})
              </span>
              <strong>{fmt(band.prob * 100, 1)}%</strong>
            </div>
          ))}
        </>
      )}
    </>
  );
}

function ProbabilityReadout({ mean, sd, prob }) {
  const { prob: p, call } = boundsProbability(prob.mode, prob.lower, prob.upper, mean, sd);
  const zLower = (prob.lower - mean) / sd;
  const zUpper = (prob.upper - mean) / sd;
  return (
    <>
      <p className="readout-def">
        P(a &le; X &le; b) = &int;<sub>a</sub><sup>b</sup> f(x) dx — the area under the probability
        density curve between a and b (Definition 1.3). A GC's <code>normalcdf</code> evaluates this
        directly from &mu; and &sigma; rather than &sigma;&sup2;.
      </p>
      <p className="formula">P({boundsSummaryLabel(prob.mode, prob.lower, prob.upper)})</p>
      <div className="result-row is-highlighted">
        <span>{call}</span>
        <strong>{fmt(p, 4)}</strong>
      </div>
      {prob.mode !== "lower" && (
        <div className="result-row">
          <span>Standardised lower bound, z = (a &minus; &mu;)/&sigma;</span>
          <strong>{fmt(zLower, 4)}</strong>
        </div>
      )}
      {prob.mode !== "upper" && (
        <div className="result-row">
          <span>Standardised upper bound, z = (b &minus; &mu;)/&sigma;</span>
          <strong>{fmt(zUpper, 4)}</strong>
        </div>
      )}
    </>
  );
}

function InverseReadout({ mean, sd, inv }) {
  const result = inverseBoundary(inv.tail, inv.p, mean, sd);
  return (
    <>
      <p className="readout-def">
        Given a probability p, <code>invNorm</code> finds the boundary value a such that P(X &le; a) = p
        (LEFT), P(X &ge; a) = p (RIGHT), or, using the curve's symmetry about &mu;, the half-width b such
        that P(|X &minus; &mu;| &le; b) = p (CENTER — see Example 2.5.3 &amp; 2.5.5).
      </p>
      <p className="formula">{result.call}</p>
      {inv.tail === "center" ? (
        <>
          <div className="result-row">
            <span>Lower boundary, &mu; &minus; b</span>
            <strong>{fmt(result.lower, 4)}</strong>
          </div>
          <div className="result-row is-highlighted">
            <span>Upper boundary, &mu; + b</span>
            <strong>{fmt(result.upper, 4)}</strong>
          </div>
        </>
      ) : (
        <div className="result-row is-highlighted">
          <span>Boundary value, a</span>
          <strong>{fmt(result.value, 4)}</strong>
        </div>
      )}
      <Condition text="If p is given as a probability of the form P(X ≤ a) = p or P(X ≥ a) = p, invNorm reads the value of a directly off the standardised area (§2.5, Standardisation)." />
    </>
  );
}

function LinearComboReadout({ combo, comboProb }) {
  const resultMean = combo.a * combo.mean1 + combo.b * combo.mean2;
  const resultVar = combo.a * combo.a * combo.sd1 * combo.sd1 + combo.b * combo.b * combo.sd2 * combo.sd2;
  const resultSd = Math.sqrt(resultVar);
  const { prob: p, call } = boundsProbability(comboProb.mode, comboProb.lower, comboProb.upper, resultMean, resultSd);
  return (
    <>
      <p className="readout-def">
        If X and Y are independent normal random variables, then aX + bY is also normal, with
        E(aX + bY) = a&mu;&#8321; + b&mu;&#8322; and Var(aX + bY) = a&sup2;&sigma;&#8321;&sup2; + b&sup2;&sigma;&#8322;&sup2; (§2.4,
        Additive Properties of Normal Random Variables).
      </p>
      <p className="formula">
        {fmt(combo.a, 2)}X {combo.b >= 0 ? "+" : "−"} {fmt(Math.abs(combo.b), 2)}Y ~ N({fmt(resultMean, 3)}, {fmt(resultVar, 3)})
      </p>
      <div className="result-row">
        <span>Resultant mean</span>
        <strong>{fmt(resultMean, 3)}</strong>
      </div>
      <div className="result-row">
        <span>Resultant variance</span>
        <strong>{fmt(resultVar, 3)}</strong>
      </div>
      <div className="result-row">
        <span>Resultant standard deviation</span>
        <strong>{fmt(resultSd, 3)}</strong>
      </div>
      <div className="result-row is-highlighted">
        <span>{call}</span>
        <strong>{fmt(p, 4)}</strong>
      </div>
    </>
  );
}

export default function ReadoutPanel({ mode, mean, sd, showEmpirical, prob, inv, combo, comboProb }) {
  return (
    <aside className="panel readout-panel">
      <p className="readout-eyebrow">Results</p>
      {mode === "curve" && <CurveReadout mean={mean} sd={sd} showEmpirical={showEmpirical} />}
      {mode === "probability" && <ProbabilityReadout mean={mean} sd={sd} prob={prob} />}
      {mode === "inverse" && <InverseReadout mean={mean} sd={sd} inv={inv} />}
      {mode === "linear" && <LinearComboReadout combo={combo} comboProb={comboProb} />}
    </aside>
  );
}
