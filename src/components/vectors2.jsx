import { useState } from "react";
import { Link } from "react-router-dom";
import ControlPanel3D from "./vector3dcomponents/ControlPanel3D";
import Scene3D from "./vector3dcomponents/Scene3D";
import ReadoutPanel3D from "./vector3dcomponents/ReadoutPanel3D";
import "./vectors2.css";

export const MODE_GROUPS = [
  {
    title: "Forms of a...",
    items: [
      { key: "lineForms", label: "Line", tagline: "Vector and Cartesian equations of a line" },
      { key: "planeForms", label: "Plane", tagline: "Vector (normal & parametric) and Cartesian equations of a plane" },
    ],
  },
  {
    title: "Relationships",
    items: [
      {
        key: "linePlane",
        label: "Line & Plane",
        tagline: "Parallel, contained, or intersecting — and the normal that decides it",
      },
      {
        key: "lineLine",
        label: "Line & Line",
        tagline: "Intersecting, parallel, or skew — or add/cross their direction vectors",
      },
      {
        key: "planePlane",
        label: "Plane & Plane",
        tagline: "Angle, perpendicular distance, and reflection across a plane",
      },
    ],
  },
  {
    title: "Point Relationships",
    items: [
      {
        key: "pointLine",
        label: "Point & Line",
        tagline: "Foot of perpendicular, shortest distance, and reflection of a point in a line",
      },
      {
        key: "pointPlane",
        label: "Point & Plane",
        tagline: "Foot of perpendicular, shortest distance, and reflection of a point in a plane",
      },
    ],
  },
];

export const MODES = Object.fromEntries(MODE_GROUPS.flatMap((g) => g.items).map((item) => [item.key, item]));

function Vectors2() {
  const [mode, setMode] = useState("lineForms");

  const [line1, setLine1] = useState({ point: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 1, z: 1 } });
  const [line2, setLine2] = useState({ point: { x: 2, y: 0, z: -1 }, direction: { x: 1, y: -1, z: 2 } });

  const [plane1, setPlane1] = useState({ point: { x: 0, y: 0, z: 4 }, normal: { x: 0, y: 0, z: 1 } });
  const [plane2, setPlane2] = useState({ point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 1, z: 0 } });

  const [point1, setPoint1] = useState({ x: 3, y: 3, z: 3 });

  const [planePlaneView, setPlanePlaneView] = useState("angle"); // "angle" | "distance" | "reflection"
  const [linePlaneView, setLinePlaneView] = useState("relationship"); // "relationship" | "reflection"
  const [lineLineView, setLineLineView] = useState("relationship"); // "relationship" | "addition" | "cross"
  const [pointLineView, setPointLineView] = useState("distance"); // "distance" | "reflection"
  const [pointPlaneView, setPointPlaneView] = useState("distance"); // "distance" | "reflection"

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="topic-header">Vectors II</h1>
        <h1>{MODES[mode].label}</h1>
        <p className="tagline">{MODES[mode].tagline}</p>
        <Link to="/vectors1" className="page-nav-link">
          ← Vectors I — dot, cross, projection in 2D
        </Link>
      </header>

      <main className="layout">
        <div className="main-row">
          <ControlPanel3D
            mode={mode}
            line1={line1}
            setLine1={setLine1}
            line2={line2}
            setLine2={setLine2}
            plane1={plane1}
            setPlane1={setPlane1}
            plane2={plane2}
            setPlane2={setPlane2}
            point1={point1}
            setPoint1={setPoint1}
            planePlaneView={planePlaneView}
            setPlanePlaneView={setPlanePlaneView}
            linePlaneView={linePlaneView}
            setLinePlaneView={setLinePlaneView}
            lineLineView={lineLineView}
            setLineLineView={setLineLineView}
            pointLineView={pointLineView}
            setPointLineView={setPointLineView}
            pointPlaneView={pointPlaneView}
            setPointPlaneView={setPointPlaneView}
          />

          <section className="canvas-panel">
            <Scene3D
              mode={mode}
              line1={line1}
              setLine1={setLine1}
              line2={line2}
              setLine2={setLine2}
              plane1={plane1}
              setPlane1={setPlane1}
              plane2={plane2}
              setPlane2={setPlane2}
              point1={point1}
              setPoint1={setPoint1}
              planePlaneView={planePlaneView}
              linePlaneView={linePlaneView}
              lineLineView={lineLineView}
              pointLineView={pointLineView}
              pointPlaneView={pointPlaneView}
            />
            <p className="canvas-hint">
              Drag empty space to orbit, scroll to zoom, or drag a point/arrow tip to edit it directly.
              z is drawn as height here; edit x, y, z below —
              entity 1 is always {" "}
              <span style={{ color: "var(--vec-a)", fontWeight: 600 }}>this color</span>, entity 2 is{" "}
              <span style={{ color: "var(--vec-b)", fontWeight: 600 }}>this color</span>, and
              anything computed (intersections, distances) is{" "}
              <span style={{ color: "var(--result)", fontWeight: 600 }}>this color</span>.
            </p>
          </section>
        </div>

        <nav className="panel mode-bar" aria-label="Concept">
          {MODE_GROUPS.map((group) => (
            <div key={group.title} className="mode-group">
              <p className="mode-group-title">{group.title}</p>
              <div className="mode-tabs">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    className={`mode-tab ${mode === item.key ? "is-active" : ""}`}
                    onClick={() => setMode(item.key)}
                    aria-pressed={mode === item.key}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <ReadoutPanel3D
          mode={mode}
          line1={line1}
          line2={line2}
          plane1={plane1}
          plane2={plane2}
          point1={point1}
          planePlaneView={planePlaneView}
          linePlaneView={linePlaneView}
          lineLineView={lineLineView}
          pointLineView={pointLineView}
          pointPlaneView={pointPlaneView}
        />
      </main>
    </div>
  );
}

export default Vectors2;
