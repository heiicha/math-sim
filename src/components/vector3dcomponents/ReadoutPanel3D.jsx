import {
  linePlaneRelationship,
  lineLineRelationship,
  planePlaneRelationship,
  reflectPointAcrossPlane,
  spanningVectors,
  cartesianLineParts,
  cartesianPlaneEquation,
} from "./geometry3D.js";
import { dot } from "../vectorcomponents/vectorMath.js";
import "../vectorcomponents/ReadoutPanel.css";
import "./ReadoutPanel3D.css";

const fmt = (n) => (Object.is(n, -0) ? "0.00" : n.toFixed(2));

function ColumnVector({ x, y, z }) {
  return (
    <span className="col-vec">
      <span className="col-vec-bracket col-vec-bracket-left" />
      <span className="col-vec-values">
        <span>{fmt(x)}</span>
        <span>{fmt(y)}</span>
        <span>{fmt(z || 0)}</span>
      </span>
      <span className="col-vec-bracket col-vec-bracket-right" />
    </span>
  );
}

function VectorRow({ label, vector }) {
  return (
    <div className="result-row result-row-vector">
      <span>{label}</span>
      <ColumnVector x={vector.x} y={vector.y} z={vector.z} />
    </div>
  );
}

function LineEquation({ pointA, direction, symbol = "r" }) {
  return (
    <div className="line-equation">
      <span className="line-eq-symbol">{symbol}</span>
      <span className="line-eq-symbol">=</span>
      <ColumnVector x={pointA.x} y={pointA.y} z={pointA.z} />
      <span className="line-eq-symbol">+ λ</span>
      <ColumnVector x={direction.x} y={direction.y} z={direction.z} />
    </div>
  );
}

function PlaneVectorEquation({ pointA, b, c }) {
  return (
    <div className="line-equation">
      <span className="line-eq-symbol">r</span>
      <span className="line-eq-symbol">=</span>
      <ColumnVector x={pointA.x} y={pointA.y} z={pointA.z} />
      <span className="line-eq-symbol">+ λ</span>
      <ColumnVector x={b.x} y={b.y} z={b.z} />
      <span className="line-eq-symbol">+ μ</span>
      <ColumnVector x={c.x} y={c.y} z={c.z} />
    </div>
  );
}

function Fraction({ num, den }) {
  return (
    <span className="frac">
      <span className="frac-num">{num}</span>
      <span className="frac-line" />
      <span className="frac-den">{den}</span>
    </span>
  );
}

function SymmetricLineEquation({ line }) {
  const { free, fixed } = cartesianLineParts(line);
  if (free.length === 0) {
    return <p className="note">Direction vector is zero — this isn't a valid line.</p>;
  }
  return (
    <div className="symmetric-eq">
      <div className="symmetric-eq-chain">
        {free.map((ax, i) => (
          <span key={ax.label} className="symmetric-eq-term">
            {i > 0 && <span className="eq-sign">=</span>}
            <Fraction num={`${ax.label} ${ax.a < 0 ? "+" : "-"} ${Math.abs(ax.a).toFixed(2)}`} den={ax.d.toFixed(2)} />
          </span>
        ))}
      </div>
      {fixed.length > 0 && (
        <p className="fixed-axes">
          {fixed.map((ax) => `${ax.label} = ${ax.a.toFixed(2)}`).join(", ")} (constant along the
          line — direction has no component here)
        </p>
      )}
    </div>
  );
}

function formatCartesianPlane(plane) {
  const { n, d } = cartesianPlaneEquation(plane);
  const terms = [
    { coef: n.x, v: "x" },
    { coef: n.y, v: "y" },
    { coef: n.z || 0, v: "z" },
  ];
  let out = "";
  let started = false;
  terms.forEach((t) => {
    if (Math.abs(t.coef) < 1e-9) return;
    const abs = Math.abs(t.coef).toFixed(2);
    const term = abs === "1.00" ? t.v : `${abs}${t.v}`;
    if (!started) {
      out += `${t.coef < 0 ? "-" : ""}${term}`;
      started = true;
    } else {
      out += t.coef < 0 ? ` - ${term}` : ` + ${term}`;
    }
  });
  if (!started) out = "0";
  return `${out} = ${d.toFixed(2)}`;
}

function Badge({ type }) {
  return <span className={`relation-badge relation-${type}`}>{type}</span>;
}

// ---- per-mode readouts ------------------------------------------------

function LineFormsReadout({ line }) {
  return (
    <>
      <p className="formula">Vector equation</p>
      <LineEquation pointA={line.point} direction={line.direction} />
      <p className="note" style={{ marginTop: 0 }}>
        a is any point on the line, d is the direction it runs in, and λ is any real number.
      </p>

      <p className="formula" style={{ marginTop: 18 }}>
        Cartesian (symmetric) equation
      </p>
      <SymmetricLineEquation line={line} />
    </>
  );
}

function PlaneFormsReadout({ plane }) {
  const { b, c } = spanningVectors(plane.normal);
  const d = dot(plane.normal, plane.point);
  return (
    <>
      <p className="formula">Vector equation (point-normal form)</p>
      <p className="formula formula-sub">r · n = a · n</p>
      <div className="result-row">
        <span>r · n</span>
        <strong>{fmt(d)}</strong>
      </div>
      <VectorRow label="n (normal)" vector={plane.normal} />

      <p className="formula" style={{ marginTop: 18 }}>
        Cartesian equation
      </p>
      <p className="cartesian-eq">{formatCartesianPlane(plane)}</p>

      <p className="formula" style={{ marginTop: 18 }}>
        Parametric vector equation
      </p>
      <PlaneVectorEquation pointA={plane.point} b={b} c={c} />
      <p className="note">
        b and c are any two independent vectors that lie in the plane (perpendicular to n) —
        together with point a, every point on the plane is reachable by some λ, μ.
      </p>
    </>
  );
}

function LinePlaneReadout({ line, plane }) {
  const rel = linePlaneRelationship(line, plane);
  return (
    <>
      <div className="result-row">
        <span>Relationship</span>
        <Badge type={rel.type} />
      </div>
      <VectorRow label="n (normal to plane)" vector={plane.normal} />

      {rel.type === "intersecting" && (
        <>
          <VectorRow label="Intersection point" vector={rel.point} />
          <div className="result-row">
            <span>Angle between line and plane</span>
            <strong>{rel.angleDeg.toFixed(1)}°</strong>
          </div>
          <p className="note">
            The line pierces the plane at exactly one point, since d · n ≠ 0. That angle is
            measured between the line and its own shadow on the plane — 90° minus the angle
            between d and n.
          </p>
        </>
      )}

      {rel.type === "parallel" && (
        <>
          <div className="result-row">
            <span>Distance from line to plane</span>
            <strong>{rel.distance.toFixed(2)}</strong>
          </div>
          <p className="note">
            d · n = 0, so the line never tilts toward the plane — and the line's point doesn't
            satisfy the plane's equation, so it sits at a constant distance away, never meeting
            it.
          </p>
        </>
      )}

      {rel.type === "contained" && (
        <p className="note">
          d · n = 0 (the line runs parallel to the plane's surface) and the line's point also
          satisfies the plane's equation — so every point on the line lies in the plane.
        </p>
      )}
    </>
  );
}

function LineLineReadout({ line1, line2 }) {
  const rel = lineLineRelationship(line1, line2);
  return (
    <>
      <div className="result-row">
        <span>Relationship</span>
        <Badge type={rel.type} />
      </div>

      {rel.type !== "same" && (
        <div className="result-row">
          <span>Angle between lines</span>
          <strong>{rel.angleDeg.toFixed(1)}°</strong>
        </div>
      )}

      {rel.type === "intersecting" && (
        <>
          <VectorRow label="Intersection point" vector={rel.point} />
          <p className="note">
            Direction vectors aren't parallel, and the two lines lie in a common plane (d₁, d₂,
            and the vector between the two points are coplanar) — so they cross at one point.
          </p>
        </>
      )}

      {rel.type === "parallel" && (
        <>
          <div className="result-row">
            <span>Distance between lines</span>
            <strong>{rel.distance.toFixed(2)}</strong>
          </div>
          <p className="note">Same direction, different lines — they never meet, and stay this far apart everywhere.</p>
        </>
      )}

      {rel.type === "same" && (
        <p className="note">Same direction, and one line's point lies on the other — these describe the exact same line.</p>
      )}

      {rel.type === "skew" && (
        <>
          <div className="result-row">
            <span>Shortest distance between lines</span>
            <strong>{rel.distance.toFixed(2)}</strong>
          </div>
          <VectorRow label="Common perpendicular direction" vector={rel.commonPerpendicular} />
          <p className="note">
            Not parallel, and not coplanar either — so they never meet. A line in 3D doesn't have
            a single "normal" the way a plane does, but d₁ × d₂ gives the one direction
            perpendicular to <em>both</em> lines at once — that's what the dashed segment on the
            canvas follows, and its length is the shortest possible distance between them.
          </p>
        </>
      )}
    </>
  );
}

function PlanePlaneReadout({ plane1, plane2, view, reflectPoint }) {
  const rel = planePlaneRelationship(plane1, plane2);

  return (
    <>
      <div className="result-row">
        <span>Relationship</span>
        <Badge type={rel.type} />
      </div>
      <div className="result-row">
        <span>Angle between planes</span>
        <strong>{rel.angleDeg.toFixed(1)}°</strong>
      </div>
      <p className="note" style={{ marginTop: 0 }}>
        The angle between two planes is the angle between their normals (or its supplement,
        whichever is acute) — no need to find where they actually cross.
      </p>

      {rel.type === "intersecting" && view !== "reflection" && (
        <>
          <p className="formula" style={{ marginTop: 16 }}>
            Line of intersection
          </p>
          <LineEquation pointA={rel.line.point} direction={rel.line.direction} />
          <p className="note">
            Its direction is n₁ × n₂ — perpendicular to both normals, which means it's the one
            direction that lies in both planes at once.
          </p>
        </>
      )}

      {(rel.type === "parallel" || rel.type === "same") && view !== "reflection" && (
        <div className="result-row" style={{ marginTop: 4 }}>
          <span>Perpendicular distance between planes</span>
          <strong>{rel.type === "same" ? "0.00 (same plane)" : rel.distance.toFixed(2)}</strong>
        </div>
      )}

      {view === "reflection" && (
        <>
          <p className="formula" style={{ marginTop: 16 }}>
            Reflection of Q across Plane 1
          </p>
          <VectorRow label="Q" vector={reflectPoint} />
          <VectorRow label="Q′ (reflected)" vector={reflectPointAcrossPlane(reflectPoint, plane1)} />
          <p className="note">
            Q′ = Q − 2 · ((Q − a)·n / n·n) · n — walk from Q straight along the normal, twice the
            signed distance to the plane, and you land on its mirror image.
          </p>
        </>
      )}
    </>
  );
}

export default function ReadoutPanel3D({
  mode,
  line1,
  line2,
  plane1,
  plane2,
  planePlaneView,
  reflectPoint,
}) {
  return (
    <div className="panel readout-panel">
      <p className="readout-eyebrow">Live readout</p>
      {mode === "lineForms" && <LineFormsReadout line={line1} />}
      {mode === "planeForms" && <PlaneFormsReadout plane={plane1} />}
      {mode === "linePlane" && <LinePlaneReadout line={line1} plane={plane1} />}
      {mode === "lineLine" && <LineLineReadout line1={line1} line2={line2} />}
      {mode === "planePlane" && (
        <PlanePlaneReadout
          plane1={plane1}
          plane2={plane2}
          view={planePlaneView}
          reflectPoint={reflectPoint}
        />
      )}
    </div>
  );
}
