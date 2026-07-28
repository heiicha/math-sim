import { useState } from "react";
import ControlPanel from "./vectorcomponents/ControlPanel";
import VectorCanvas from "./vectorcomponents/VectorCanvas";
import ReadoutPanel from "./vectorcomponents/ReadoutPanel";
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
    tagline: "Tip-to-tail: walk a, then walk b",
  },
  projection: {
    label: "Projection",
    tagline: "The shadow a casts onto b, and what's left over",
  },
  ratio: {
    label: "Ratio Theorem",
    tagline: "Where a point sits between A and B",
  },
};

function Vectors1() {
  const [mode, setMode] = useState("dot");
  const [vecA, setVecA] = useState({ tail: { x: -2, y: 0, z: 0 }, head: { x: 1, y: 2, z: 1 } });
  const [vecB, setVecB] = useState({ tail: { x: 0, y: -1, z: 0 }, head: { x: 2, y: 1, z: -1 } });

  const [crossShape, setCrossShape] = useState("parallelogram"); // "parallelogram" | "triangle"
  const [ratio, setRatio] = useState({ m: 1, n: 1 });
  const componentsOf = (v) => ({
    x: v.head.x - v.tail.x,
    y: v.head.y - v.tail.y,
    z: (v.head.z || 0) - (v.tail.z || 0),
  });
  const componentsA = componentsOf(vecA);
  const componentsB = componentsOf(vecB);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="topic-header"> Vectors I</h1>
        <h1>{MODES[mode].label}</h1>
        <p className="tagline">{MODES[mode].tagline}</p>
      </header>

      <main className="layout">
        <ControlPanel
          mode={mode}
          setMode={setMode}
          vecA={vecA}
          setVecA={setVecA}
          vecB={vecB}
          setVecB={setVecB}
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
            crossShape={crossShape}
            ratio={ratio}
          />
          <p className="canvas-hint">
            Input coordinates in x y z format on the left or drag arrow/circles.
          </p>
        </section>

        <section className="readout-panel">
          <ReadoutPanel
            mode={mode}
            vecA={componentsA}
            vecB={componentsB}
            pointA={vecA.head}
            pointB={vecB.head}
            crossShape={crossShape}
            ratio={ratio}
          />
        </section>
      </main>
    </div>
  );
}

export default Vectors1;
