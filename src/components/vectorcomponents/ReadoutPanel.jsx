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
        a · b = a<sub>1</sub>b<sub>1</sub> + a<sub>2</sub>b<sub>2</sub> + a<sub>3</sub>b<sub>3</sub>
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
      <p className="formula">a × b = (a₂b₃ − a₃b₂)i + (a₃b₁ − a₁b₃)j + (a₁b₂ − a₂b₁)k</p>
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

const SUBSCRIPTS = ["₁", "₂", "₃"];
const IJK = ["i", "j", "k"];

function AdditionReadout({ vectors }) {
  const result = vectors.reduce((acc, v) => add(acc, v.vector), { x: 0, y: 0, z: 0 });
  const sumLabel = vectors.map((v) => v.label).join(" + ");
  const formula =
    `${sumLabel} = ` +
    SUBSCRIPTS.map((sub, i) => `(${vectors.map((v) => v.label + sub).join("+")})${IJK[i]}`).join(" + ");

  return (
    <>
      <p className="formula">{formula}</p>
      <div className="result-row">
        <span>{sumLabel}</span>
        <strong>{toIJK(result)}</strong>
      </div>
      <div className="result-row">
        <span>|{sumLabel}|</span>
        <strong>{magnitude(result).toFixed(2)}</strong>
      </div>
      <p className="note">
        By the Triangle Law of Vector Addition, {sumLabel} is found tip-to-tail: walk along each
        vector in turn — the resultant is the vector straight from the start to the end.
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
      <p className="formula">u = (a · b̂) b̂</p>
      <div className="result-row">
        <span>u (projection vector of a onto b)</span>
        <strong>{toIJK(projVec)}</strong>
      </div>
      <div className="result-row">
        <span>Length of projection of a onto b, |a · b̂|</span>
        <strong>{fmt(scalar)}</strong>
      </div>
      <div className="result-row">
        <span>v (vector component of a perpendicular to b)</span>
        <strong>{toIJK(perp)}</strong>
      </div>
      <p className="note">
        u is a's shadow along b; v is what's left over once you remove that shadow — together
        u + v = <em>a</em>, forming a right-angled triangle with a as its hypotenuse.
      </p>
    </>
  );
}

function RatioReadout({ pointA, pointB, ratio }) {
  const P = sectionFormula(pointA, pointB, ratio.lambda, ratio.mu);
  return (
    <>
      <p className="formula">OP = (μa + λb) / (λ + μ)</p>
      <div className="result-row">
        <span>A (a's head)</span>
        <strong>{toIJK(pointA)}</strong>
      </div>
      <div className="result-row">
        <span>B (b's head)</span>
        <strong>{toIJK(pointB)}</strong>
      </div>
      <div className="result-row">
        <span>P, where AP : PB = {ratio.lambda} : {ratio.mu}</span>
        <strong>{toIJK(P)}</strong>
      </div>
      <p className="note">
        This is the Ratio Theorem: P divides AB in the ratio λ : μ. λ = μ gives the midpoint;
        letting one of λ, μ go negative moves P outside the segment (external division).
      </p>
    </>
  );
}

export default function ReadoutPanel({ mode, vecA, vecB, vecC, vecD, pointA, pointB, crossShape, ratio }) {
  const additionVectors = [
    { label: "a", vector: vecA },
    { label: "b", vector: vecB },
    ...(vecC ? [{ label: "c", vector: vecC }] : []),
    ...(vecD ? [{ label: "d", vector: vecD }] : []),
  ];

  return (
    <aside className="panel readout-panel">
      <p className="readout-eyebrow">Results</p>
      {mode === "dot" && <DotReadout vecA={vecA} vecB={vecB} />}
      {mode === "cross" && <CrossReadout vecA={vecA} vecB={vecB} crossShape={crossShape} />}
      {mode === "addition" && <AdditionReadout vectors={additionVectors} />}
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
          {mode === "addition" && vecC && (
            <div className="result-row">
              <span>|c|</span>
              <strong>{magnitude(vecC).toFixed(2)}</strong>
            </div>
          )}
          {mode === "addition" && vecD && (
            <div className="result-row">
              <span>|d|</span>
              <strong>{magnitude(vecD).toFixed(2)}</strong>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
