import {
  dot,
  crossProduct,
  angleBetween,
  scalarProjection,
  vectorProjection,
  perpendicularComponent,
  add,
  subtract,
  magnitude,
  normalize,
  vectorRelationship,
  sectionFormula,
  toDegrees,
  toIJK,
} from "./vectorMath.js";
import "./ReadoutPanel.css";

const fmt = (n) => (Object.is(n, -0) ? "0.00" : n.toFixed(2));

// Quoted verbatim from the Vectors I notes (Results 2.4, 3.5, 4.3).
const PARALLEL_CONDITION =
  "a is parallel to b ⟺ b = λa for some real scalar λ. (Result 2.4) Equivalently, a × b = 0 ⟺ a = 0 OR b = 0 OR a and b are parallel. (Result 4.3)";
const PERPENDICULAR_CONDITION =
  "a · b = 0 ⟺ a = 0 OR b = 0 OR a and b are perpendicular. (Result 3.5)";
const COLLINEARITY_CONDITION =
  "Three distinct points A, B and C are collinear if and only if AB = λBC for some real scalar λ, with a common point (in this case B). (Definition 2.5)";

function Condition({ text }) {
  if (!text) return null;
  return (
    <p className="condition">
      <span className="condition-label">From the notes</span>
      {text}
    </p>
  );
}

function RelationshipRow({ vecA, vecB, condition }) {
  const rel = vectorRelationship(vecA, vecB);
  if (rel === "degenerate") return null;
  const label = rel === "neither" ? "neither parallel nor ⊥" : rel;
  return (
    <>
      <div className="result-row">
        <span>Relationship</span>
        <strong>{label}</strong>
      </div>
      {rel === condition.type && <Condition text={condition.text} />}
    </>
  );
}

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
      <RelationshipRow
        vecA={vecA}
        vecB={vecB}
        condition={{ type: "perpendicular", text: PERPENDICULAR_CONDITION }}
      />
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
  const theta = toDegrees(angleBetween(vecA, vecB));
  const hasNormal = area > 1e-9;
  return (
    <>
      <p className="formula">a × b = (a₂b₃ − a₃b₂)i + (a₃b₁ − a₁b₃)j + (a₁b₂ − a₂b₁)k</p>
      <p className="formula formula-sub">|a × b| = |a| |b| sin θ</p>
      <div className="result-row">
        <span>a × b</span>
        <strong>{toIJK(c)}</strong>
      </div>
      <div className="result-row">
        <span>θ between a, b</span>
        <strong>{theta.toFixed(1)}°</strong>
      </div>
      <div className="result-row">
        <span>n̂ (unit vector ⊥ to both a, b)</span>
        <strong>{hasNormal ? toIJK(normalize(c)) : "undefined"}</strong>
      </div>
      <div className={`result-row ${crossShape === "parallelogram" ? "is-highlighted" : ""}`}>
        <span>parallelogram area</span>
        <strong>{area.toFixed(2)}</strong>
      </div>
      <div className={`result-row ${crossShape === "triangle" ? "is-highlighted" : ""}`}>
        <span>triangle area (½ × parallelogram)</span>
        <strong>{(area / 2).toFixed(2)}</strong>
      </div>
      <RelationshipRow vecA={vecA} vecB={vecB} condition={{ type: "parallel", text: PARALLEL_CONDITION }} />
      <p className="note">
        a × b is perpendicular to both a and b, and its length equals the area of the
        parallelogram they span — half of that is the triangle O-A-B. n̂ = (a × b)/|a × b| points
        the same way, by the right-hand rule.
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

function SubtractionReadout({ vecA, vecB }) {
  const diff = subtract(vecB, vecA);
  return (
    <>
      <p className="formula">
        b − a = (b<sub>1</sub> − a<sub>1</sub>)i + (b<sub>2</sub> − a<sub>2</sub>)j + (b<sub>3</sub> − a<sub>3</sub>)k
      </p>
      <div className="result-row">
        <span>a</span>
        <strong>{toIJK(vecA)}</strong>
      </div>
      <div className="result-row">
        <span>b</span>
        <strong>{toIJK(vecB)}</strong>
      </div>
      <div className="result-row">
        <span>b − a</span>
        <strong>{toIJK(diff)}</strong>
      </div>
      <div className="result-row">
        <span>|b − a|</span>
        <strong>{magnitude(diff).toFixed(2)}</strong>
      </div>
      <Condition text="The displacement vector from point A to point B is the vector AB with start point A and end point B. In general, AB = OB − OA. (Definition 2.2)" />
      <p className="note">
        Draw a and b from the same starting point — b − a is the vector that runs from a's tip to
        b's tip, since (walking along a, then along b − a) lands you in the same place as walking
        straight along b.
      </p>
    </>
  );
}

function ProjectionReadout({ vecA, vecB }) {
  const projVec = vectorProjection(vecA, vecB);
  const scalar = scalarProjection(vecA, vecB);
  const perp = perpendicularComponent(vecA, vecB);
  const perpLength = magnitude(perp);
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
      <p className="formula formula-sub" style={{ marginTop: 14 }}>
        |v| = √(|a|² − (a · b̂)²)
      </p>
      <div className="result-row">
        <span>v (vector component of a perpendicular to b)</span>
        <strong>{toIJK(perp)}</strong>
      </div>
      <div className="result-row">
        <span>|v| (length of perpendicular component)</span>
        <strong>{fmt(perpLength)}</strong>
      </div>
      <p className="note">
        u is a's shadow along b; v is what's left over once you remove that shadow — together
        u + v = <em>a</em>, forming a right-angled triangle with a as its hypotenuse.
      </p>
    </>
  );
}

// Definition 1.5: â = a / |a|, undefined for the zero vector.
function MagnitudeRow({ label, hatLabel, vector }) {
  const m = magnitude(vector);
  return (
    <>
      <div className="result-row">
        <span>|{label}|</span>
        <strong>{m.toFixed(2)}</strong>
      </div>
      <div className="result-row">
        <span>{hatLabel}</span>
        <strong>{m > 1e-9 ? toIJK(normalize(vector)) : "undefined"}</strong>
      </div>
    </>
  );
}

function CollinearReadout({ pointA, pointB, pointC }) {
  const AB = subtract(pointB, pointA);
  const BC = subtract(pointC, pointB);
  const rel = vectorRelationship(AB, BC);
  const collinear = rel === "parallel";

  return (
    <>
      <p className="formula">AB = λ BC for some real scalar λ</p>
      <div className="result-row">
        <span>A</span>
        <strong>{toIJK(pointA)}</strong>
      </div>
      <div className="result-row">
        <span>B</span>
        <strong>{toIJK(pointB)}</strong>
      </div>
      <div className="result-row">
        <span>C</span>
        <strong>{toIJK(pointC)}</strong>
      </div>
      <div className="result-row">
        <span>AB</span>
        <strong>{toIJK(AB)}</strong>
      </div>
      <div className="result-row">
        <span>BC</span>
        <strong>{toIJK(BC)}</strong>
      </div>
      <div className="result-row">
        <span>Collinear?</span>
        <strong>{rel === "degenerate" ? "two points coincide" : collinear ? "yes" : "no"}</strong>
      </div>
      <Condition text={COLLINEARITY_CONDITION} />
      <p className="note">
        {rel === "degenerate"
          ? "Two of the three points are in the same place, so this isn't a meaningful test — drag one of them apart."
          : collinear
          ? "AB and BC are scalar multiples of each other, and they share point B — so A, B and C all lie on one straight line."
          : "AB and BC aren't scalar multiples of each other, so A, B and C don't lie on a common line."}
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

export default function ReadoutPanel({
  mode,
  vecA,
  vecB,
  vecC,
  vecD,
  pointA,
  pointB,
  pointC,
  crossShape,
  ratio,
}) {
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
      {mode === "subtraction" && <SubtractionReadout vecA={vecA} vecB={vecB} />}
      {mode === "projection" && <ProjectionReadout vecA={vecA} vecB={vecB} />}
      {mode === "ratio" && <RatioReadout pointA={pointA} pointB={pointB} ratio={ratio} />}
      {mode === "collinear" && pointC && (
        <CollinearReadout pointA={pointA} pointB={pointB} pointC={pointC} />
      )}

      {mode !== "ratio" && mode !== "collinear" && (
        <div className="magnitudes">
          <p className="formula formula-sub" style={{ marginTop: 0 }}>
            â = a / |a|
          </p>
          <MagnitudeRow label="a" hatLabel="â" vector={vecA} />
          <MagnitudeRow label="b" hatLabel="b̂" vector={vecB} />
          {mode === "addition" && vecC && <MagnitudeRow label="c" hatLabel="ĉ" vector={vecC} />}
          {mode === "addition" && vecD && <MagnitudeRow label="d" hatLabel="d̂" vector={vecD} />}
        </div>
      )}
    </aside>
  );
}
