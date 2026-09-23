import { useMemo, useState } from "react";
import ControlPanel from "./transformcomponents/ControlPanel";
import GraphCanvas from "./transformcomponents/GraphCanvas";
import ReadoutPanel from "./transformcomponents/ReadoutPanel";
import HintPopup from "./HintPopup";
import { parseFunction } from "./transformcomponents/exprMath";
import { DEFAULT_STEPS, IDENTITY, applyStep, buildEvaluator, composeSteps } from "./transformcomponents/transformMath";
import "./transformations.css";

export const MODES = {
  translate: {
    label: "Translation",
    tagline: "Moves every point of the graph the same distance, in the same direction.",
  },
  scale: {
    label: "Scaling",
    tagline: "Stretches or compresses every point's distance from an axis by a constant factor.",
  },
  reflect: {
    label: "Reflection",
    tagline: "Maps every point of the graph to its mirror image in a fixed axis.",
  },
  sandbox: {
    label: "Sandbox",
    tagline: "Chain up to 5 translations, scalings and reflections, and watch the equation build up.",
  },
};

function Transformations() {
  const [mode, setMode] = useState("translate");
  const [equation, setEquation] = useState("sin(x)");

  const [translateStep, setTranslateStep] = useState({ ...DEFAULT_STEPS.translate });
  const [scaleStep, setScaleStep] = useState({ ...DEFAULT_STEPS.scale });
  const [reflectStep, setReflectStep] = useState({ ...DEFAULT_STEPS.reflect });
  const [sandboxSteps, setSandboxSteps] = useState([]);

  const { fn: baseFn, error: eqError } = useMemo(() => {
    try {
      return { fn: parseFunction(equation), error: null };
    } catch (err) {
      return { fn: null, error: err.message };
    }
  }, [equation]);

  const activeState = useMemo(() => {
    if (mode === "translate") return applyStep(IDENTITY, translateStep);
    if (mode === "scale") return applyStep(IDENTITY, scaleStep);
    if (mode === "reflect") return applyStep(IDENTITY, reflectStep);
    return composeSteps(sandboxSteps);
  }, [mode, translateStep, scaleStep, reflectStep, sandboxSteps]);

  const transformedFn = baseFn ? buildEvaluator(baseFn, activeState) : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="topic-header">Transformations of Graphs</h1>
        <h1>{MODES[mode].label}</h1>
        <p className="tagline">{MODES[mode].tagline}</p>
      </header>

      <main className="layout">
        <div className="main-row">
          <ControlPanel
            mode={mode}
            equation={equation}
            setEquation={setEquation}
            eqError={eqError}
            translateStep={translateStep}
            setTranslateStep={setTranslateStep}
            scaleStep={scaleStep}
            setScaleStep={setScaleStep}
            reflectStep={reflectStep}
            setReflectStep={setReflectStep}
            sandboxSteps={sandboxSteps}
            setSandboxSteps={setSandboxSteps}
          />

          <section className="canvas-panel">
            <GraphCanvas baseFn={baseFn} transformedFn={transformedFn} showOriginal />
            <HintPopup storageKey="transformations-hint-dismissed">
              Type an equation in terms of x, then adjust the transformation. The original y ={" "}
              <span style={{ color: "var(--vec-a)", fontWeight: 600 }}>f(x)</span> is shown faint and
              dashed; the transformed curve is{" "}
              <span style={{ color: "var(--result)", fontWeight: 600 }}>solid</span>. Drag to pan and scroll
              to zoom (on a touch screen, drag with two fingers and pinch). Reset view recentres the graph.
            </HintPopup>
          </section>
        </div>

        <nav className="panel mode-bar" aria-label="Transformation">
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

        <ReadoutPanel
          mode={mode}
          translateStep={translateStep}
          scaleStep={scaleStep}
          reflectStep={reflectStep}
          sandboxSteps={sandboxSteps}
          hasEquation={!!baseFn}
        />
      </main>
    </div>
  );
}

export default Transformations;
