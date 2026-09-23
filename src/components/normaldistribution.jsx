import { useMemo, useState } from "react";
import ControlPanel from "./normaldistributioncomponents/ControlPanel";
import ReadoutPanel from "./normaldistributioncomponents/ReadoutPanel";
import BellCurveCanvas from "./statscomponents/BellCurveCanvas";
import HintPopup from "./HintPopup";
import { boundsProbability, inverseBoundary } from "./normaldistributioncomponents/ndMath";
import "./normaldistribution.css";

export const MODES = {
  curve: {
    label: "The Normal Curve",
    tagline: "A continuous random variable whose probability density curve is bell-shaped and symmetric about its mean.",
  },
  probability: {
    label: "Normal Probabilities",
    tagline: "The area under the curve between two bounds is the probability X falls between them — normalcdf, worked live.",
  },
  inverse: {
    label: "Inverse Normal",
    tagline: "Given an area, find the boundary value that cuts it off — invNorm, worked live.",
  },
  linear: {
    label: "Linear Combinations",
    tagline: "A linear combination of independent normal random variables is itself normal.",
  },
};

export default function NormalDistribution() {
  const [mode, setMode] = useState("curve");

  const [mean, setMean] = useState(100);
  const [sd, setSd] = useState(15);
  const [showEmpirical, setShowEmpirical] = useState(false);

  const [prob, setProb] = useState({ mode: "between", lower: 85, upper: 115 });
  const [inv, setInv] = useState({ p: 0.9, tail: "left" });

  const [combo, setCombo] = useState({
    mean1: 100,
    sd1: 15,
    mean2: 90,
    sd2: 10,
    a: 1,
    b: -1,
    secondary: "none",
  });
  const [comboProb, setComboProb] = useState({ mode: "upper", lower: 0, upper: 20 });

  const { shade, markers } = useMemo(() => {
    if (mode === "curve") {
      if (!showEmpirical) return { shade: [], markers: [{ x: mean, label: "μ", color: "var(--result)" }] };
      return {
        shade: [
          { from: mean - 3 * sd, to: mean + 3 * sd, color: "var(--accent)", alpha: 40 },
          { from: mean - 2 * sd, to: mean + 2 * sd, color: "var(--accent)", alpha: 70 },
          { from: mean - sd, to: mean + sd, color: "var(--accent)", alpha: 110 },
        ],
        markers: [{ x: mean, label: "μ", color: "var(--result)" }],
      };
    }
    if (mode === "probability") {
      const { shadeFrom, shadeTo } = boundsProbability(prob.mode, prob.lower, prob.upper, mean, sd);
      const m = [];
      if (Number.isFinite(shadeFrom)) m.push({ x: shadeFrom, label: fmtBoundary(shadeFrom) });
      if (Number.isFinite(shadeTo)) m.push({ x: shadeTo, label: fmtBoundary(shadeTo) });
      return { shade: [{ from: shadeFrom, to: shadeTo }], markers: m };
    }
    if (mode === "inverse") {
      const result = inverseBoundary(inv.tail, inv.p, mean, sd);
      const m = [];
      if (inv.tail === "center") {
        m.push({ x: result.lower, label: fmtBoundary(result.lower) }, { x: result.upper, label: fmtBoundary(result.upper) });
      } else {
        m.push({ x: result.value, label: fmtBoundary(result.value) });
      }
      return { shade: [{ from: result.shadeFrom, to: result.shadeTo, color: "var(--result)" }], markers: m };
    }
    return { shade: [], markers: [] };
  }, [mode, mean, sd, showEmpirical, prob, inv]);

  const linearPrimary = useMemo(() => {
    const resultMean = combo.a * combo.mean1 + combo.b * combo.mean2;
    const resultVar = combo.a * combo.a * combo.sd1 * combo.sd1 + combo.b * combo.b * combo.sd2 * combo.sd2;
    return { mean: resultMean, sd: Math.sqrt(Math.max(resultVar, 1e-6)), color: "var(--result)" };
  }, [combo]);

  const linearSecondary = useMemo(() => {
    if (combo.secondary === "X") return { mean: combo.mean1, sd: combo.sd1, color: "var(--vec-a)" };
    if (combo.secondary === "Y") return { mean: combo.mean2, sd: combo.sd2, color: "var(--vec-b)" };
    return null;
  }, [combo]);

  const linearShade = useMemo(() => {
    const { shadeFrom, shadeTo } = boundsProbability(comboProb.mode, comboProb.lower, comboProb.upper, linearPrimary.mean, linearPrimary.sd);
    return [{ from: shadeFrom, to: shadeTo, color: "var(--result)" }];
  }, [comboProb, linearPrimary]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="topic-header">Normal Distribution</h1>
        <h1>{MODES[mode].label}</h1>
        <p className="tagline">{MODES[mode].tagline}</p>
      </header>

      <main className="layout">
        <div className="main-row">
          <ControlPanel
            mode={mode}
            mean={mean}
            setMean={setMean}
            sd={sd}
            setSd={setSd}
            showEmpirical={showEmpirical}
            setShowEmpirical={setShowEmpirical}
            prob={prob}
            setProb={setProb}
            inv={inv}
            setInv={setInv}
            combo={combo}
            setCombo={setCombo}
            comboProb={comboProb}
            setComboProb={setComboProb}
          />

          <section className="canvas-panel">
            {mode === "linear" ? (
              <BellCurveCanvas primary={linearPrimary} secondary={linearSecondary} shade={linearShade} />
            ) : (
              <BellCurveCanvas primary={{ mean, sd, color: "var(--result)" }} shade={shade} markers={markers} />
            )}
            <div className="canvas-legend">
              <span className="canvas-legend-item">
                <span className="canvas-legend-swatch" style={{ background: "var(--result)" }} />
                {mode === "linear" ? "aX + bY" : "X ~ N(μ, σ²)"}
              </span>
              {mode === "linear" && combo.secondary !== "none" && (
                <span className="canvas-legend-item">
                  <span className="canvas-legend-swatch is-dashed" />
                  {combo.secondary}
                </span>
              )}
            </div>
            <HintPopup storageKey="normaldist-hint-dismissed">
              Drag the sliders to change the distribution's parameters. The shaded region always
              shows the probability being computed on the current tab.
            </HintPopup>
          </section>
        </div>

        <nav className="panel mode-bar" aria-label="Normal Distribution section">
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

        <ReadoutPanel mode={mode} mean={mean} sd={sd} showEmpirical={showEmpirical} prob={prob} inv={inv} combo={combo} comboProb={comboProb} />
      </main>
    </div>
  );
}

function fmtBoundary(n) {
  const r = Math.round(n * 100) / 100;
  return String(r);
}
