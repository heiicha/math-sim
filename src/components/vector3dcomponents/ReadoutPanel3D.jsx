import {
  linePlaneRelationship,
  lineLineRelationship,
  planePlaneRelationship,
  reflectLineAcrossPlane,
  reflectPlaneAcrossPlane,
  reflectPointAcrossPlane,
  reflectPointAcrossLine,
  pointLineRelationship,
  pointPlaneRelationship,
  spanningVectors,
  cartesianLineParts,
  cartesianPlaneEquation,
} from "./geometry3D.js";
import { dot, add, crossProduct, magnitude } from "../vectorcomponents/vectorMath.js";
import "../vectorcomponents/ReadoutPanel.css";
import "./ReadoutPanel3D.css";

const fmt = (n) => (Object.is(n, -0) ? "0.00" : n.toFixed(2));
const SUBSCRIPTS = ["₁", "₂", "₃", "₄"];

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

function PlaneVectorEquation({ pointA, m1, m2 }) {
  return (
    <div className="line-equation">
      <span className="line-eq-symbol">r</span>
      <span className="line-eq-symbol">=</span>
      <ColumnVector x={pointA.x} y={pointA.y} z={pointA.z} />
      <span className="line-eq-symbol">+ λ</span>
      <ColumnVector x={m1.x} y={m1.y} z={m1.z} />
      <span className="line-eq-symbol">+ μ</span>
      <ColumnVector x={m2.x} y={m2.y} z={m2.z} />
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

// "contained" is our internal relationship-type key; the notes phrase this
// case as the line "lying on" the plane, so that's what the badge shows.
const BADGE_LABEL = { contained: "lies on plane" };

function Badge({ type }) {
  return <span className={`relation-badge relation-${type}`}>{BADGE_LABEL[type] ?? type}</span>;
}

function PairHeading({ a, b }) {
  return (
    <div className="result-row pair-heading">
      <span>
        <span style={{ color: a.color }}>{a.label}</span> &amp; <span style={{ color: b.color }}>{b.label}</span>
      </span>
    </div>
  );
}

// ---- per-mode readouts ------------------------------------------------

function LineFormsReadout({ line }) {
  return (
    <>
      <p className="formula">Vector equation</p>
      <LineEquation pointA={line.point} direction={line.direction} />
      <p className="note" style={{ marginTop: 0 }}>
        a is any point on the line, m is the direction it runs in (commonly known as a direction
        vector of the line), and λ is any real number.
      </p>

      <p className="formula" style={{ marginTop: 18 }}>
        Cartesian equation
      </p>
      <SymmetricLineEquation line={line} />
    </>
  );
}

function PlaneFormsReadout({ plane }) {
  const { m1, m2 } = spanningVectors(plane.normal);
  const d = dot(plane.normal, plane.point);
  return (
    <>
      <p className="formula">Vector equation (scalar-product form)</p>
      <p className="formula formula-sub">r · n = a · n</p>
      <div className="result-row">
        <span>D (= a · n)</span>
        <strong>{fmt(d)}</strong>
      </div>
      <VectorRow label="n (normal)" vector={plane.normal} />

      <p className="formula" style={{ marginTop: 18 }}>
        Cartesian equation
      </p>
      <p className="cartesian-eq">{formatCartesianPlane(plane)}</p>

      <p className="formula" style={{ marginTop: 18 }}>
        Vector equation (parametric form)
      </p>
      <PlaneVectorEquation pointA={plane.point} m1={m1} m2={m2} />
      <p className="note">
        m₁ and m₂ are two vectors that are both parallel to the plane but not parallel to each
        other — together with point a, every point on the plane is reachable by some λ, μ.
      </p>
    </>
  );
}

// lines/planes: arrays of { key, label, color, data }. line1/plane1 are
// always present; the rest are whichever extras the student has added.
function LinePlaneReadout({ lines, planes, view }) {
  if (view === "reflection") {
    const mirror = planes[0];

    if (lines.length === 1) {
      // default (exactly 1 line, 1 plane): original text, unchanged
      const reflected = reflectLineAcrossPlane(lines[0].data, mirror.data);
      return (
        <>
          <p className="formula">Line reflected across the plane</p>
          <LineEquation pointA={reflected.point} direction={reflected.direction} symbol="r′" />
          <p className="note">
            The point reflects the usual way (twice the signed distance to the plane, along the
            normal); the direction reflects too, since it's a free vector — m′ = m − 2·(m·n / n·n)·n.
          </p>
        </>
      );
    }

    return (
      <>
        {lines.map((entry) => {
          const reflected = reflectLineAcrossPlane(entry.data, mirror.data);
          return (
            <div className="pair-block" key={entry.key}>
              <p className="formula">
                {entry.label} reflected across {mirror.label}
              </p>
              <LineEquation pointA={reflected.point} direction={reflected.direction} symbol="r′" />
            </div>
          );
        })}
        <p className="note">
          Every line reflects across {mirror.label} the same way: the point reflects twice the
          signed distance to {mirror.label} along its normal, and the direction reflects too since
          it's a free vector — m′ = m − 2·(m·n / n·n)·n.
        </p>
      </>
    );
  }

  const pairs = [];
  lines.forEach((l) => {
    planes.forEach((pl) => {
      pairs.push({ line: l, plane: pl, rel: linePlaneRelationship(l.data, pl.data) });
    });
  });

  if (pairs.length === 1) {
    // default (exactly 1 line, 1 plane): original text, unchanged
    const rel = pairs[0].rel;
    return (
      <>
        <div className="result-row">
          <span>Relationship</span>
          <Badge type={rel.type} />
        </div>
        <VectorRow label="n (normal to plane)" vector={planes[0].data.normal} />

        {rel.type === "intersecting" && (
          <>
            <VectorRow label="Intersection point" vector={rel.point} />
            <div className="result-row">
              <span>Angle between line and plane</span>
              <strong>{rel.angleDeg.toFixed(1)}°</strong>
            </div>
            <p className="note">
              The line pierces the plane at exactly one point, since m · n ≠ 0. That angle is
              measured between the line and its own shadow on the plane — 90° minus the angle
              between m and n.
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
              m · n = 0, so the line never tilts toward the plane — and the line's point doesn't
              satisfy the plane's equation, so it sits at a constant distance away, never meeting
              it.
            </p>
          </>
        )}

        {rel.type === "contained" && (
          <p className="note">
            m · n = 0 (the line runs parallel to the plane's surface) and the line's point also
            satisfies the plane's equation — so every point on the line lies in the plane.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      {pairs.map((pr) => (
        <div className="pair-block" key={`${pr.line.key}-${pr.plane.key}`}>
          <PairHeading a={pr.line} b={pr.plane} />
          <div className="result-row">
            <span>Relationship</span>
            <Badge type={pr.rel.type} />
          </div>
          {pr.rel.type === "intersecting" && (
            <>
              <VectorRow label="Intersection point" vector={pr.rel.point} />
              <div className="result-row">
                <span>Angle</span>
                <strong>{pr.rel.angleDeg.toFixed(1)}°</strong>
              </div>
            </>
          )}
          {pr.rel.type === "parallel" && (
            <div className="result-row">
              <span>Distance</span>
              <strong>{pr.rel.distance.toFixed(2)}</strong>
            </div>
          )}
        </div>
      ))}
      <p className="note">
        Every line-plane pair is shown above — intersecting pairs give a point and angle, parallel
        pairs a distance, and "lies on plane" means every point of that line is on that plane.
      </p>
    </>
  );
}

function LineLineReadout({ lines, view }) {
  if (view === "addition") {
    if (lines.length === 2) {
      // default (exactly line1, line2): original text, unchanged
      const sum = add(lines[0].data.direction, lines[1].data.direction);
      return (
        <>
          <p className="formula">m₁ + m₂</p>
          <VectorRow label="m₁" vector={lines[0].data.direction} />
          <VectorRow label="m₂" vector={lines[1].data.direction} />
          <VectorRow label="m₁ + m₂" vector={sum} />
          <div className="result-row">
            <span>|m₁ + m₂|</span>
            <strong>{fmt(magnitude(sum))}</strong>
          </div>
          <p className="note">
            Tip-to-tail from line 1's point: walk along m₁, then from there walk along m₂ — you land
            in the same place as walking straight along m₁ + m₂.
          </p>
        </>
      );
    }

    const dirLabels = lines.map((_, i) => `m${SUBSCRIPTS[i]}`);
    const sumLabel = dirLabels.join(" + ");
    const sum = lines.reduce((acc, l) => add(acc, l.data.direction), { x: 0, y: 0, z: 0 });
    return (
      <>
        <p className="formula">{sumLabel}</p>
        {lines.map((l, i) => (
          <VectorRow key={l.key} label={dirLabels[i]} vector={l.data.direction} />
        ))}
        <VectorRow label={sumLabel} vector={sum} />
        <div className="result-row">
          <span>|{sumLabel}|</span>
          <strong>{fmt(magnitude(sum))}</strong>
        </div>
        <p className="note">
          Tip-to-tail from line 1's point: walk along each direction vector in turn — you land in
          the same place as walking straight along the sum.
        </p>
      </>
    );
  }

  if (view === "cross") {
    // cross product is strictly binary — always line1 x line2, regardless
    // of how many extra lines are present
    const cross = crossProduct(lines[0].data.direction, lines[1].data.direction);
    return (
      <>
        <p className="formula">m₁ × m₂</p>
        <VectorRow label="m₁ × m₂" vector={cross} />
        <div className="result-row">
          <span>Area of the spanned parallelogram</span>
          <strong>{fmt(magnitude(cross))}</strong>
        </div>
        <p className="note">
          m₁ and m₂, anchored at line 1's point, span a parallelogram (drawn on the canvas) —
          |m₁ × m₂| is exactly that parallelogram's area, and the cross product itself points
          along the one direction perpendicular to both.
        </p>
      </>
    );
  }

  const pairs = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = lines[i];
      const b = lines[j];
      pairs.push({ a, b, rel: lineLineRelationship(a.data, b.data) });
    }
  }

  if (pairs.length === 1) {
    // default (exactly line1, line2): original text, unchanged
    const rel = pairs[0].rel;
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
              Direction vectors aren't parallel, and the two lines lie in a common plane (m₁, m₂,
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
              a single "normal" the way a plane does, but m₁ × m₂ gives the one direction
              perpendicular to <em>both</em> lines at once — that's what the dashed segment on the
              canvas follows, and its length is the shortest possible distance between them.
            </p>
          </>
        )}
      </>
    );
  }

  return (
    <>
      {pairs.map((pr) => (
        <div className="pair-block" key={`${pr.a.key}-${pr.b.key}`}>
          <PairHeading a={pr.a} b={pr.b} />
          <div className="result-row">
            <span>Relationship</span>
            <Badge type={pr.rel.type} />
          </div>
          {pr.rel.type !== "same" && (
            <div className="result-row">
              <span>Angle</span>
              <strong>{pr.rel.angleDeg.toFixed(1)}°</strong>
            </div>
          )}
          {pr.rel.type === "intersecting" && <VectorRow label="Intersection point" vector={pr.rel.point} />}
          {(pr.rel.type === "parallel" || pr.rel.type === "skew") && (
            <div className="result-row">
              <span>{pr.rel.type === "skew" ? "Shortest distance" : "Distance"}</span>
              <strong>{pr.rel.distance.toFixed(2)}</strong>
            </div>
          )}
        </div>
      ))}
      <p className="note">
        Every pair among the {lines.length} lines is shown above — intersecting pairs give a point
        and angle, parallel/skew pairs give a distance (skew lines also never share a plane, so
        that distance is measured along their common perpendicular).
      </p>
    </>
  );
}

function PlanePlaneReadout({ planes, view }) {
  if (view === "reflection") {
    const mirror = planes[0];
    const others = planes.slice(1);

    if (others.length === 1) {
      // default (exactly plane1, plane2): original text, unchanged
      const reflected = reflectPlaneAcrossPlane(others[0].data, mirror.data);
      return (
        <>
          <p className="formula" style={{ marginTop: 16 }}>
            Plane 2 reflected across Plane 1
          </p>
          <VectorRow label="a′ (point)" vector={reflected.point} />
          <VectorRow label="n′ (normal)" vector={reflected.normal} />
          <p className="note">
            The point reflects the usual way (twice the signed distance to Plane 1, along its
            normal); the normal reflects too, since it's a free vector — n′ = n − 2·(n·n₁ / n₁·n₁)·n₁.
          </p>
        </>
      );
    }

    return (
      <>
        {others.map((entry) => {
          const reflected = reflectPlaneAcrossPlane(entry.data, mirror.data);
          return (
            <div className="pair-block" key={entry.key}>
              <p className="formula">
                {entry.label} reflected across {mirror.label}
              </p>
              <VectorRow label="a′ (point)" vector={reflected.point} />
              <VectorRow label="n′ (normal)" vector={reflected.normal} />
            </div>
          );
        })}
        <p className="note">
          Every other plane reflects across {mirror.label} the same way: the point reflects twice
          the signed distance to {mirror.label} along its normal, and the normal reflects too since
          it's a free vector.
        </p>
      </>
    );
  }

  const pairs = [];
  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      const a = planes[i];
      const b = planes[j];
      pairs.push({ a, b, rel: planePlaneRelationship(a.data, b.data) });
    }
  }

  if (pairs.length === 1) {
    // default (exactly plane1, plane2): original text, unchanged
    const rel = pairs[0].rel;
    return (
      <>
        <div className="result-row">
          <span>Relationship</span>
          <Badge type={rel.type} />
        </div>

        {view === "angle" && (
          <>
            <div className="result-row">
              <span>Angle between planes</span>
              <strong>{rel.angleDeg.toFixed(1)}°</strong>
            </div>
            <p className="note" style={{ marginTop: 0 }}>
              The angle between two planes is the angle between their normals (or its supplement,
              whichever is acute) — no need to find where they actually cross.
            </p>

            {rel.type === "intersecting" && (
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
          </>
        )}

        {view === "distance" && (
          <>
            <div className="result-row" style={{ marginTop: 4 }}>
              <span>Perpendicular distance between planes</span>
              <strong>
                {rel.type === "intersecting"
                  ? "0.00 (they intersect)"
                  : rel.type === "same"
                  ? "0.00 (same plane)"
                  : rel.distance.toFixed(2)}
              </strong>
            </div>
            <p className="note">
              {rel.type === "intersecting" &&
                "The planes cross along a line, so there's no constant gap between them — it's 0 right at that line, and grows the further you move away from it. Switch to the Angle tab to see where that line runs."}
              {rel.type === "same" && "These are the same plane described two different ways — every point coincides."}
              {rel.type === "parallel" &&
                "n₁ ∥ n₂, so the planes never tilt toward each other — the gap between them is the same everywhere, measured straight along the shared normal direction."}
            </p>
          </>
        )}
      </>
    );
  }

  return (
    <>
      {pairs.map((pr) => (
        <div className="pair-block" key={`${pr.a.key}-${pr.b.key}`}>
          <PairHeading a={pr.a} b={pr.b} />
          <div className="result-row">
            <span>Relationship</span>
            <Badge type={pr.rel.type} />
          </div>
          {view === "angle" && (
            <div className="result-row">
              <span>Angle</span>
              <strong>{pr.rel.angleDeg.toFixed(1)}°</strong>
            </div>
          )}
          {view === "distance" && (
            <div className="result-row">
              <span>Perpendicular distance</span>
              <strong>
                {pr.rel.type === "intersecting"
                  ? "0.00 (they intersect)"
                  : pr.rel.type === "same"
                  ? "0.00 (same plane)"
                  : pr.rel.distance.toFixed(2)}
              </strong>
            </div>
          )}
        </div>
      ))}
      <p className="note">
        {view === "angle"
          ? "Every pair among the planes is shown above — the angle between two planes is the angle between their normals (or its supplement, whichever is acute)."
          : "Every pair among the planes is shown above — intersecting pairs have distance 0; parallel/same pairs have a constant gap."}
      </p>
    </>
  );
}

function PointLineReadout({ point, line, view }) {
  const rel = pointLineRelationship(point, line);
  if (rel.type === "degenerate") {
    return <p className="note">Direction vector is zero — this isn't a valid line.</p>;
  }

  if (view === "reflection") {
    const reflected = reflectPointAcrossLine(point, line);
    return (
      <>
        <p className="formula">Point reflected in the line</p>
        <VectorRow label="N (foot of perpendicular)" vector={rel.foot} />
        <VectorRow label="P′ (reflected point)" vector={reflected} />
        <p className="note">
          N is the midpoint of P and P′ — once N is found, the Ratio Theorem (with λ = μ) gives
          P′ = 2N − P.
        </p>
      </>
    );
  }

  return (
    <>
      <VectorRow label="N (foot of perpendicular)" vector={rel.foot} />
      <div className="result-row">
        <span>Shortest distance from P to the line</span>
        <strong>{fmt(rel.distance)}</strong>
      </div>
      <p className="note">
        N is found by projecting AP onto m (A is any point on the line): AN = (AP · m / m · m) m,
        then N = A + AN. PN is perpendicular to m, so |PN| is the shortest distance from P to the
        line.
      </p>
    </>
  );
}

function PointPlaneReadout({ point, plane, view }) {
  const rel = pointPlaneRelationship(point, plane);
  if (rel.type === "degenerate") {
    return <p className="note">Normal vector is zero — this isn't a valid plane.</p>;
  }

  if (view === "reflection") {
    const reflected = reflectPointAcrossPlane(point, plane);
    return (
      <>
        <p className="formula">Point reflected in the plane</p>
        <VectorRow label="N (foot of perpendicular)" vector={rel.foot} />
        <VectorRow label="P′ (reflected point)" vector={reflected} />
        <p className="note">
          N is the midpoint of P and P′ — once N is found, the Ratio Theorem (with λ = μ) gives
          P′ = 2N − P.
        </p>
      </>
    );
  }

  return (
    <>
      <VectorRow label="N (foot of perpendicular)" vector={rel.foot} />
      <div className="result-row">
        <span>Shortest distance from P to the plane</span>
        <strong>{fmt(rel.distance)}</strong>
      </div>
      <p className="note">
        N is found by projecting QA onto n̂ (A is any point on the plane, Q = P): QN = (QA · n̂) n̂,
        then N = Q + QN. PN runs along n, so |PN| is the shortest distance from P to the plane.
      </p>
    </>
  );
}

export default function ReadoutPanel3D({
  mode,
  line1,
  line2,
  line3,
  line4,
  plane1,
  plane2,
  plane3,
  plane4,
  lpLine1,
  lpLine2,
  lpPlane1,
  lpPlane2,
  point1,
  planePlaneView,
  linePlaneView,
  lineLineView,
  pointLineView,
  pointPlaneView,
}) {
  const lineLineEntries = [
    { key: "line1", label: "Line 1", color: "var(--vec-a)", data: line1 },
    { key: "line2", label: "Line 2", color: "var(--vec-b)", data: line2 },
    ...(line3 ? [{ key: "line3", label: "Line 3", color: "var(--vec-c)", data: line3 }] : []),
    ...(line4 ? [{ key: "line4", label: "Line 4", color: "var(--vec-d)", data: line4 }] : []),
  ];

  const planePlaneEntries = [
    { key: "plane1", label: "Plane 1", color: "var(--vec-a)", data: plane1 },
    { key: "plane2", label: "Plane 2", color: "var(--vec-b)", data: plane2 },
    ...(plane3 ? [{ key: "plane3", label: "Plane 3", color: "var(--vec-c)", data: plane3 }] : []),
    ...(plane4 ? [{ key: "plane4", label: "Plane 4", color: "var(--vec-d)", data: plane4 }] : []),
  ];

  // Line & Plane: same fixed slot priority (lines before planes) that
  // ControlPanel3D and Scene3D use for the shared 2-extra-slot pool.
  const lpFilled = [
    lpLine1 && { key: "lpLine1", label: "Extra Line 1", data: lpLine1, type: "line" },
    lpLine2 && { key: "lpLine2", label: "Extra Line 2", data: lpLine2, type: "line" },
    lpPlane1 && { key: "lpPlane1", label: "Extra Plane 1", data: lpPlane1, type: "plane" },
    lpPlane2 && { key: "lpPlane2", label: "Extra Plane 2", data: lpPlane2, type: "plane" },
  ].filter(Boolean);
  const linePlaneLineEntries = [{ key: "line1", label: "Line", color: "var(--vec-a)", data: line1 }];
  const linePlanePlaneEntries = [{ key: "plane1", label: "Plane", color: "var(--vec-b)", data: plane1 }];
  lpFilled.forEach((slot, i) => {
    const entry = { key: slot.key, label: slot.label, color: i === 0 ? "var(--vec-c)" : "var(--vec-d)", data: slot.data };
    if (slot.type === "line") linePlaneLineEntries.push(entry);
    else linePlanePlaneEntries.push(entry);
  });

  return (
    <div className="panel readout-panel">
      <p className="readout-eyebrow">Live readout</p>
      {mode === "lineForms" && <LineFormsReadout line={line1} />}
      {mode === "planeForms" && <PlaneFormsReadout plane={plane1} />}
      {mode === "linePlane" && (
        <LinePlaneReadout lines={linePlaneLineEntries} planes={linePlanePlaneEntries} view={linePlaneView} />
      )}
      {mode === "lineLine" && <LineLineReadout lines={lineLineEntries} view={lineLineView} />}
      {mode === "planePlane" && <PlanePlaneReadout planes={planePlaneEntries} view={planePlaneView} />}
      {mode === "pointLine" && (
        <PointLineReadout point={point1} line={line1} view={pointLineView} />
      )}
      {mode === "pointPlane" && (
        <PointPlaneReadout point={point1} plane={plane1} view={pointPlaneView} />
      )}
    </div>
  );
}
