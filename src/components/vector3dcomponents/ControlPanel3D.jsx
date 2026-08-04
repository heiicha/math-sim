import { MODE_GROUPS } from "../vectors2";
import "../vectorcomponents/ControlPanel.css";
import "./ControlPanel3D.css";

function ColumnInput({ label, color, vector, onChange }) {
  const update = (key) => (e) => {
    const value = parseFloat(e.target.value);
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
          <input type="number" value={vector.x} onChange={update("x")} step="0.5" aria-label={`${label} x`} />
          <input type="number" value={vector.y} onChange={update("y")} step="0.5" aria-label={`${label} y`} />
          <input
            type="number"
            value={vector.z || 0}
            onChange={update("z")}
            step="0.5"
            aria-label={`${label} z`}
          />
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
  setMode,
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
  reflectPoint,
  setReflectPoint,
}) {
  return (
    <aside className="panel control-panel">
      <nav className="mode-tabs-grouped" aria-label="Concept">
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
          </>
        )}

        {mode === "lineLine" && (
          <>
            <LineInputs label="Line 1" color="var(--vec-a)" line={line1} onChange={setLine1} />
            <LineInputs label="Line 2" color="var(--vec-b)" line={line2} onChange={setLine2} />
          </>
        )}

        {mode === "planePlane" && (
          <>
            <PlaneInputs label="Plane 1" color="var(--vec-a)" plane={plane1} onChange={setPlane1} />
            <PlaneInputs label="Plane 2" color="var(--vec-b)" plane={plane2} onChange={setPlane2} />

            <div className="shape-toggle">
              <p className="shape-toggle-label">Show</p>
              <div className="shape-toggle-buttons">
                <button
                  className={planePlaneView === "angle" ? "is-active" : ""}
                  onClick={() => setPlanePlaneView("angle")}
                >
                  Angle
                </button>
                <button
                  className={planePlaneView === "distance" ? "is-active" : ""}
                  onClick={() => setPlanePlaneView("distance")}
                >
                  Distance
                </button>
                <button
                  className={planePlaneView === "reflection" ? "is-active" : ""}
                  onClick={() => setPlanePlaneView("reflection")}
                >
                  Reflection
                </button>
              </div>
            </div>

            {planePlaneView === "reflection" && (
              <div className="entity-group">
                <p className="entity-title" style={{ color: "var(--result)" }}>
                  Point to reflect (across Plane 1)
                </p>
                <ColumnInput label="Q" color="var(--result)" vector={reflectPoint} onChange={setReflectPoint} />
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
