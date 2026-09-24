import BellCurveCanvas from "../statscomponents/BellCurveCanvas";
import HintPopup from "../HintPopup";
import DecisionTable from "./DecisionTable";
import { TAIL_OPTIONS, criticalRegions, pValueRegions } from "./hypothesisMath";
import { fmt } from "../../utils/statsMath";

function FormulateView({ values }) {
  const tailInfo = TAIL_OPTIONS.find((t) => t.value === values.tail);
  return (
    <div className="formulate-view">
      <p className="step-sentence" style={{ fontSize: "1.15rem" }}>
        Test <span className="step-subject">H₀ : μ = {fmt(values.mu0, 2)}</span> against{" "}
        <span className="step-subject">
          H₁ : μ {tailInfo.symbol} {fmt(values.mu0, 2)}
        </span>
      </p>
      <p className="note">
        This is a {values.tail === "two" ? "two-tailed" : "one-tailed"} test — H₁ looks for{" "}
        {tailInfo.hint} in the population mean away from the claimed value.
      </p>
      <HintPopup>
        H₀ always states an <em>equality</em>. H₁'s direction depends only on what the researcher
        suspects has changed — pick the tail that matches the question's wording ("has decreased",
        "has increased", "has changed / is no longer").
      </HintPopup>
    </div>
  );
}

function RunView({ values, test }) {
  if (!test) {
    return <p className="note">Enter valid sample data on the left to run the test.</p>;
  }
  const critRegions = criticalRegions(test.tail, test.criticalValues).map((r) => ({
    ...r,
    color: "#e96b6a",
    alpha: 90,
  }));
  const pRegions = pValueRegions(test.tail, test.z).map((r) => ({
    ...r,
    color: "#4cc9f0",
    alpha: 70,
  }));
  const markers = [
    { x: test.z, label: `z = ${fmt(test.z, 3)}`, color: "var(--result)", dashed: false },
    ...test.criticalValues.map((cv) => ({ x: cv, label: fmt(cv, 3), color: "#e96b6a" })),
  ];

  return (
    <div className="run-view">
      <BellCurveCanvas primary={{ mean: 0, sd: 1 }} shade={[...critRegions, ...pRegions]} markers={markers} />
      <div className="canvas-legend">
        <div className="canvas-legend-item">
          <span className="canvas-legend-swatch" style={{ background: "#e96b6a" }} />
          Critical region (Method 1)
        </div>
        <div className="canvas-legend-item">
          <span className="canvas-legend-swatch" style={{ background: "#4cc9f0" }} />
          p-value region (Method 2)
        </div>
        <div className="canvas-legend-item">
          <span className="canvas-legend-swatch" style={{ background: "var(--result)" }} />
          Test statistic z
        </div>
      </div>
      {!values.varianceKnown && !(values.n >= 30) && (
        <p className="note" style={{ color: "#e96b6a" }}>
          Warning: σ² is unknown and n is small — this combination is not in syllabus (the unbiased
          estimate s² needs a large sample to invoke the Central Limit Theorem; see the Case Explorer
          tab).
        </p>
      )}
      <HintPopup>
        The red region is the critical region for the chosen α and tail; the blue region is the
        p-value region bounded by the test statistic z. Reject H₀ exactly when z falls in the red
        region — equivalently, whenever the p-value ≤ α.
      </HintPopup>
    </div>
  );
}

function CaseView({ values }) {
  const nLarge = values.n >= 30;
  return (
    <div className="case-view">
      <DecisionTable isNormal={values.isNormal} varianceKnown={values.varianceKnown} nLarge={nLarge} />
    </div>
  );
}

export default function CanvasArea({ mode, values, test }) {
  return (
    <section className="canvas-panel">
      {mode === "formulate" && <FormulateView values={values} />}
      {mode === "run" && <RunView values={values} test={test} />}
      {mode === "cases" && <CaseView values={values} />}
    </section>
  );
}
