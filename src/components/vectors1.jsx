import { useState } from "react";
import TransitionLink from "./TransitionLink";
import ControlPanel from "./vectorcomponents/ControlPanel";
import VectorCanvas from "./vectorcomponents/VectorCanvas";
import ReadoutPanel from "./vectorcomponents/ReadoutPanel";
import HintPopup from "./HintPopup";
import "./vectors1.css";

export const MODES = {
  dot: {
    label: "Dot Product",
    tagline: "The scalar product of two vectors. Geometrically, the scalar/dot product represents |a||b| cos(θ).",
  },
  cross: {
    label: "Cross Product",
    tagline: "The vector product of two vectors. Geometrically, the cross product represents (|a||b|sin(θ))n̂. \n This 2D representation is meant purely for just visualization of how we can use cross product to find the areas of triangles and parallelograms. \n For 3D representation, look into the 3D vectors page!",
  },
  addition: {
    label: "Addition",
    tagline: "Either tip-to-tail or will form the diagonal of a parallelogram",
  },
  subtraction: {
    label: "Subtraction",
    tagline: "The displacement vector from a's tip to b's tip, when both are drawn from the same point: b − a.",
  },
  projection: {
    label: "Projection",
    tagline: "The shadow a casts onto b",
  },
  ratio: {
    label: "Ratio Theorem",
    tagline: "Where a point sits between A and B",
  },
  collinear: {
    label: "Collinearity",
    tagline: "Are A, B and C all on one straight line? AB = λBC for some real scalar λ.",
  },
};

function Vectors1() {
  const [mode, setMode] = useState("dot");
  const [vecA, setVecA] = useState({ tail: { x: -2, y: 0, z: 0 }, head: { x: 1, y: 2, z: 1 } });
  const [vecB, setVecB] = useState({ tail: { x: 0, y: -1, z: 0 }, head: { x: 2, y: 1, z: -1 } });
  // c and d are optional — added via the "+ Add vector" button in Addition
  // mode, up to 2 extra vectors on top of the default a, b.
  const [vecC, setVecC] = useState(null);
  const [vecD, setVecD] = useState(null);

  const [crossShape, setCrossShape] = useState("parallelogram"); // "parallelogram" | "triangle"
  const [ratio, setRatio] = useState({ lambda: 1, mu: 1 });

  // Collinearity needs a third point C — auto-add it (if not already
  // present from Addition mode) the moment the student switches in.
  const handleModeChange = (key) => {
    setMode(key);
    if (key === "collinear" && !vecC) {
      setVecC({ tail: { x: 0, y: 0, z: 0 }, head: { x: -1, y: 3, z: 2 } });
    }
  };
  const componentsOf = (v) => ({
    x: v.head.x - v.tail.x,
    y: v.head.y - v.tail.y,
    z: (v.head.z || 0) - (v.tail.z || 0),
  });
  const componentsA = componentsOf(vecA);
  const componentsB = componentsOf(vecB);
  const componentsC = vecC ? componentsOf(vecC) : null;
  const componentsD = vecD ? componentsOf(vecD) : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="topic-header"> Vectors I</h1>
        <h1>{MODES[mode].label}</h1>
        <p className="tagline">{MODES[mode].tagline}</p>
        <TransitionLink to="/vectors2" className="page-nav-link">
          Vectors II — lines &amp; planes in 3D →
        </TransitionLink>
      </header>

      <main className="layout">
        <div className="main-row">
          <ControlPanel
            mode={mode}
            vecA={vecA}
            setVecA={setVecA}
            vecB={vecB}
            setVecB={setVecB}
            vecC={vecC}
            setVecC={setVecC}
            vecD={vecD}
            setVecD={setVecD}
            crossShape={crossShape}
            setCrossShape={setCrossShape}
            ratio={ratio}
            setRatio={setRatio}
          />

          <section className="canvas-panel">
            <VectorCanvas
              mode={mode}
              vecA={vecA}
              setVecA={setVecA}
              vecB={vecB}
              setVecB={setVecB}
              vecC={vecC}
              setVecC={setVecC}
              vecD={vecD}
              setVecD={setVecD}
              crossShape={crossShape}
              ratio={ratio}
            />
            <HintPopup storageKey="vectors1-hint-dismissed">
              Input coordinates below or drag the arrows/circles. All vectors here are position vectors. (i.e <b>a</b> = OA)
            </HintPopup>
          </section>
        </div>

        <nav className="panel mode-bar" aria-label="Vector operation">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              className={`mode-tab ${mode === key ? "is-active" : ""}`}
              onClick={() => handleModeChange(key)}
              aria-pressed={mode === key}
            >
              {m.label}
            </button>
          ))}
        </nav>

        <section className="readout-panel">
          <ReadoutPanel
            mode={mode}
            vecA={componentsA}
            vecB={componentsB}
            vecC={componentsC}
            vecD={componentsD}
            pointA={vecA.head}
            pointB={vecB.head}
            pointC={vecC ? vecC.head : null}
            crossShape={crossShape}
            ratio={ratio}
          />
        </section>
      </main>
    </div>
  );
}

export default Vectors1;
