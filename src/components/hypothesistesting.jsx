import { useMemo, useState } from "react";
import ControlPanel from "./hypothesistestingcomponents/ControlPanel";
import CanvasArea from "./hypothesistestingcomponents/CanvasArea";
import ReadoutPanel from "./hypothesistestingcomponents/ReadoutPanel";
import { computeTest } from "./hypothesistestingcomponents/hypothesisMath";
import "./hypothesistesting.css";

const MODES = {
  formulate: {
    label: "Formulate Hypotheses",
    tagline: "State the null hypothesis as an equality, and choose the direction H₁ looks for.",
  },
  run: {
    label: "Run the Test",
    tagline: "Compute the test statistic, compare it to the critical region, and read off the p-value.",
  },
  cases: {
    label: "Case Explorer",
    tagline: "Which formula for X̄ applies? Depends on normality, whether σ² is known, and sample size.",
  },
};

function HypothesisTesting() {
  const [mode, setMode] = useState("formulate");

  const [mu0, setMu0] = useState(70);
  const [tail, setTail] = useState("less");

  const [xbar, setXbar] = useState(68.5);
  const [n, setN] = useState(40);
  const [varianceKnown, setVarianceKnown] = useState(true);
  const [sigma, setSigma] = useState(6);
  const [s, setS] = useState(6);
  const [alphaPct, setAlphaPct] = useState(5);
  const [isNormal, setIsNormal] = useState(true);

  const values = { mu0, tail, xbar, n, varianceKnown, sigma, s, alphaPct, isNormal };
  const setters = { setMu0, setTail, setXbar, setN, setVarianceKnown, setSigma, setS, setAlphaPct, setIsNormal };

  const test = useMemo(
    () =>
      computeTest({
        mu0,
        tail,
        xbar,
        n,
        sigmaOrS: varianceKnown ? sigma : s,
        alpha: alphaPct / 100,
      }),
    [mu0, tail, xbar, n, varianceKnown, sigma, s, alphaPct],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="topic-header">Hypothesis Testing</h1>
        <h1>{MODES[mode].label}</h1>
        <p className="tagline">{MODES[mode].tagline}</p>
      </header>

      <main className="layout">
        <div className="main-row">
          <ControlPanel mode={mode} values={values} setters={setters} />
          <CanvasArea mode={mode} values={values} test={test} />
        </div>

        <nav className="panel mode-bar" aria-label="Hypothesis testing stage">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              className={`mode-tab ${mode === key ? "is-active" : ""}`}
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
            >
              {m.label}
            </button>
          ))}
        </nav>

        <ReadoutPanel mode={mode} values={values} test={test} />
      </main>
    </div>
  );
}

export default HypothesisTesting;
