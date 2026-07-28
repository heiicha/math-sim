import {
  dot,
  crossProduct,
  angleBetween,
  scalarProjection,
  vectorProjection,
  perpendicularComponent,
  add,
  magnitude,
  sectionFormula,
  toDegrees,
  toIJK,
} from "./vectorMath.js";
import "./ReadoutPanel.css";

const fmt = (n) => (Object.is(n, -0) ? "0.00" : n.toFixed(2));


function DotReadout({ vecA, vecB }) {
  const value = dot(vecA, vecB);
  const theta = toDegrees(angleBetween(vecA, vecB));
  return (
    <>
      <p className="formula">
        a · b = a<sub>x</sub>b<sub>x</sub> + a<sub>y</sub>b<sub>y</sub> + a<sub>z</sub>b<sub>z</sub>
      </p>
      <p className="formula formula-sub">a · b = |a| |b| cos θ</p>
      <div className="result-row">
        <span>a · b</span>
        <strong>{fmt(value)}</strong>
      </div>
      <div className="result-row">
        <span>θ between a, b</span>
        <strong>{theta.toFixed(1)}°</strong>
      </div>
      <p className="note">
        {value > 0
          ? "Positive: the vectors point in broadly the same direction (angle under 90°)."
          : value < 0
          ? "Negative: the vectors point in broadly opposite directions (angle over 90°)."
          : "Zero: the vectors are perpendicular."}
      </p>
    </>
  );
}

function CrossReadout({ vecA, vecB, crossShape }) {
  const c = crossProduct(vecA, vecB);
  const area = magnitude(c);
  return (
    <>
      <p className="formula">a × b = (a₂b₃ − a₃b₂)i − (a₁b₃ − a₃b₁)j + (a₁b₂ − a₂b₁)k</p>
      <div className="result-row">
        <span>a × b</span>
        <strong>{toIJK(c)}</strong>
      </div>
      <div className={`result-row ${crossShape === "parallelogram" ? "is-highlighted" : ""}`}>
        <span>parallelogram area</span>
        <strong>{area.toFixed(2)}</strong>
      </div>
      <div className={`result-row ${crossShape === "triangle" ? "is-highlighted" : ""}`}>
        <span>triangle area (½ × parallelogram)</span>
        <strong>{(area / 2).toFixed(2)}</strong>
      </div>
      <p className="note">
        a × b is perpendicular to both a and b, and its length equals the area of the
        parallelogram they span — half of that is the triangle O-A-B.
        {vecA.z === 0 && vecB.z === 0
          ? " With both vectors flat (z = 0) here, the sign of the k-component also tells you rotation: positive means a to b sweeps counter-clockwise."
          : ""}
      </p>
    </>
  );
}

function AdditionReadout({ vecA, vecB }) {
  const result = add(vecA, vecB);
  return (
    <>
      <p className="formula">a + b = (a₁+b₁)i + (a₂+b₂)j + (a₃+b₃)k</p>
      <div className="result-row">
        <span>a + b</span>
        <strong>{toIJK(result)}</strong>
      </div>
      <div className="result-row">
        <span>|a + b|</span>
        <strong>{magnitude(result).toFixed(2)}</strong>
      </div>
      <p className="note">
        Resultant vector from addition will follow tip-to-tail rule. 
      </p>
    </>
  );
}

function ProjectionReadout({ vecA, vecB }) {
  const projVec = vectorProjection(vecA, vecB);
  const scalar = scalarProjection(vecA, vecB);
  const perp = perpendicularComponent(vecA, vecB);
  return (
    <>
      <p className="formula">proj_b(a) = (a · b / b · b) b</p>
      <div className="result-row">
        <span>proj_b(a)</span>
        <strong>{toIJK(projVec)}</strong>
      </div>
      <div className="result-row">
        <span>scalar length</span>
        <strong>{fmt(scalar)}</strong>
      </div>
      <div className="result-row">
        <span>perp = a − proj_b(a)</span>
        <strong>{toIJK(perp)}</strong>
      </div>
      <p className="note">
        proj_b(a) is a's shadow along b; perp is what's left over once you remove that shadow —
        together they add back up to exactly <em>a</em>.
      </p>
    </>
  );
}

function RatioReadout({ pointA, pointB, ratio }) {
  const P = sectionFormula(pointA, pointB, ratio.m, ratio.n);
  return (
    <>
      <p className="formula">P = (n·A + m·B) / (m + n)</p>
      <div className="result-row">
        <span>A (a's head)</span>
        <strong>{toIJK(pointA)}</strong>
      </div>
      <div className="result-row">
        <span>B (b's head)</span>
        <strong>{toIJK(pointB)}</strong>
      </div>
      <div className="result-row">
        <span>P, where AP : PB = {ratio.m} : {ratio.n}</span>
        <strong>{toIJK(P)}</strong>
      </div>
      <p className="note">
        This is the section (ratio) theorem: P sits along segment AB at the point that splits it
        into lengths in the ratio m : n. m = n gives the midpoint; letting one of m, n go negative
        moves P outside the segment (external division).
      </p>
    </>
  );
}

export default function ReadoutPanel({ mode, vecA, vecB, pointA, pointB, crossShape, ratio }) {
  return (
    <aside className="panel readout-panel">
      <p className="readout-eyebrow">Results</p>
      {mode === "dot" && <DotReadout vecA={vecA} vecB={vecB} />}
      {mode === "cross" && <CrossReadout vecA={vecA} vecB={vecB} crossShape={crossShape} />}
      {mode === "addition" && <AdditionReadout vecA={vecA} vecB={vecB} />}
      {mode === "projection" && <ProjectionReadout vecA={vecA} vecB={vecB} />}
      {mode === "ratio" && <RatioReadout pointA={pointA} pointB={pointB} ratio={ratio} />}

      {mode !== "ratio" && (
        <div className="magnitudes">
          <div className="result-row">
            <span>|a|</span>
            <strong>{magnitude(vecA).toFixed(2)}</strong>
          </div>
          <div className="result-row">
            <span>|b|</span>
            <strong>{magnitude(vecB).toFixed(2)}</strong>
          </div>
        </div>
      )}
    </aside>
  );
}
