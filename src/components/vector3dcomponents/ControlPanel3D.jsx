import NumberLineInput from "../vectorcomponents/NumberLineInput";
import "../vectorcomponents/ControlPanel.css";
import "./ControlPanel3D.css";

function ColumnInput({ label, color, vector, onChange }) {
  const update = (key, value) => {
    onChange({ ...vector, [key]: Number.isNaN(value) ? 0 : value });
  };
  return (
    <div className="vector-input-group">
      <span className="vector-label" style={{ color }}>
        {label}
      </span>
      <div className="bracket-pair">
        <div className="bracket bracket-left" style={{ borderColor: color }} />
        <div className="bracket-values">
          {["x", "y", "z"].map((key) => (
            <div className="axis-row" key={key}>
              <input
                type="number"
                value={vector[key] || 0}
                onChange={(e) => update(key, parseFloat(e.target.value))}
                step="0.5"
                aria-label={`${label} ${key}`}
              />
              <NumberLineInput
                value={vector[key] || 0}
                onChange={(v) => update(key, v)}
                color={color}
              />
            </div>
          ))}
        </div>
        <div className="bracket bracket-right" style={{ borderColor: color }} />
      </div>
    </div>
  );
}

function LineInputs({ label, color, line, onChange }) {
  return (
    <div className="entity-group">
      <p className="entity-title" style={{ color }}>
        {label}
      </p>
      <ColumnInput
        label="a"
        color={color}
        vector={line.point}
        onChange={(p) => onChange({ ...line, point: p })}
      />
      <ColumnInput
        label="d"
        color={color}
        vector={line.direction}
        onChange={(d) => onChange({ ...line, direction: d })}
      />
    </div>
  );
}

function ShowToggle({ options, value, onChange }) {
  return (
    <div className="shape-toggle">
      <p className="shape-toggle-label">Show</p>
      <div className="shape-toggle-buttons">
        {options.map((opt) => (
          <button
            key={opt.key}
            className={value === opt.key ? "is-active" : ""}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlaneInputs({ label, color, plane, onChange }) {
  return (
    <div className="entity-group">
      <p className="entity-title" style={{ color }}>
        {label}
      </p>
      <ColumnInput
        label="a"
        color={color}
        vector={plane.point}
        onChange={(p) => onChange({ ...plane, point: p })}
      />
      <ColumnInput
        label="n"
        color={color}
        vector={plane.normal}
        onChange={(n) => onChange({ ...plane, normal: n })}
      />
    </div>
  );
}

export default function ControlPanel3D({
  mode,
  line1,
  setLine1,
  line2,
  setLine2,
  plane1,
  setPlane1,
  plane2,
  setPlane2,
  planePlaneView,
  setPlanePlaneView,
  linePlaneView,
  setLinePlaneView,
  lineLineView,
  setLineLineView,
}) {
  return (
    <aside className="panel control-panel">
      <div className="entity-inputs">
        {mode === "lineForms" && (
          <LineInputs label="Line" color="var(--vec-a)" line={line1} onChange={setLine1} />
        )}

        {mode === "planeForms" && (
          <PlaneInputs label="Plane" color="var(--vec-a)" plane={plane1} onChange={setPlane1} />
        )}

        {mode === "linePlane" && (
          <>
            <LineInputs label="Line" color="var(--vec-a)" line={line1} onChange={setLine1} />
            <PlaneInputs label="Plane" color="var(--vec-b)" plane={plane1} onChange={setPlane1} />

            <ShowToggle
              value={linePlaneView}
              onChange={setLinePlaneView}
              options={[
                { key: "relationship", label: "Relationship" },
                { key: "reflection", label: "Reflection" },
              ]}
            />
          </>
        )}

        {mode === "lineLine" && (
          <>
            <LineInputs label="Line 1" color="var(--vec-a)" line={line1} onChange={setLine1} />
            <LineInputs label="Line 2" color="var(--vec-b)" line={line2} onChange={setLine2} />

            <ShowToggle
              value={lineLineView}
              onChange={setLineLineView}
              options={[
                { key: "relationship", label: "Relationship" },
                { key: "addition", label: "Addition" },
                { key: "cross", label: "Cross Product" },
              ]}
            />
          </>
        )}

        {mode === "planePlane" && (
          <>
            <PlaneInputs label="Plane 1" color="var(--vec-a)" plane={plane1} onChange={setPlane1} />
            <PlaneInputs label="Plane 2" color="var(--vec-b)" plane={plane2} onChange={setPlane2} />

            <ShowToggle
              value={planePlaneView}
              onChange={setPlanePlaneView}
              options={[
                { key: "angle", label: "Angle" },
                { key: "distance", label: "Distance" },
                { key: "reflection", label: "Reflection" },
              ]}
            />
          </>
        )}
      </div>
    </aside>
  );
}
