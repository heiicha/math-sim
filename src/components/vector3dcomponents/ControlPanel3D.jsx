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
        label="m"
        color={color}
        vector={line.direction}
        onChange={(d) => onChange({ ...line, direction: d })}
      />
    </div>
  );
}

function PointInputs({ label, color, point, onChange }) {
  return (
    <div className="entity-group">
      <p className="entity-title" style={{ color }}>
        {label}
      </p>
      <ColumnInput label="p" color={color} vector={point} onChange={onChange} />
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

// Defaults for entities added via the "+" buttons below — distinct enough
// from line1/line2/plane1/plane2 (and from each other) that a newly added
// entity doesn't start out overlapping something already on screen.
const EXTRA_LINE_DEFAULTS = {
  line3: { point: { x: 0, y: 2, z: -1 }, direction: { x: 1, y: 0, z: 1 } },
  line4: { point: { x: -2, y: 0, z: 2 }, direction: { x: 0, y: 1, z: -1 } },
};
const EXTRA_PLANE_DEFAULTS = {
  plane3: { point: { x: 0, y: 3, z: 0 }, normal: { x: 1, y: 1, z: 0 } },
  plane4: { point: { x: 3, y: 0, z: 3 }, normal: { x: 0, y: 1, z: 1 } },
};
const LP_LINE_DEFAULTS = {
  lpLine1: { point: { x: 0, y: 2, z: -1 }, direction: { x: 1, y: 0, z: 1 } },
  lpLine2: { point: { x: -2, y: 0, z: 2 }, direction: { x: 0, y: 1, z: -1 } },
};
const LP_PLANE_DEFAULTS = {
  lpPlane1: { point: { x: 0, y: 3, z: 0 }, normal: { x: 1, y: 1, z: 0 } },
  lpPlane2: { point: { x: 3, y: 0, z: 3 }, normal: { x: 0, y: 1, z: 1 } },
};

// Up to 2 extra lines for Line & Line, on top of the always-present line1/line2.
function ExtraLines({ line3, setLine3, line4, setLine4 }) {
  const slots = [
    { key: "line3", label: "Line 3", color: "var(--vec-c)", value: line3, setValue: setLine3 },
    { key: "line4", label: "Line 4", color: "var(--vec-d)", value: line4, setValue: setLine4 },
  ];
  const nextEmpty = slots.find((s) => !s.value);

  return (
    <>
      {slots.map((s) =>
        s.value ? (
          <div className="removable-entity" key={s.key}>
            <LineInputs label={s.label} color={s.color} line={s.value} onChange={s.setValue} />
            <button
              type="button"
              className="remove-entity-button"
              onClick={() => s.setValue(null)}
              aria-label={`Remove ${s.label}`}
            >
              ×
            </button>
          </div>
        ) : null
      )}
      {nextEmpty && (
        <button
          type="button"
          className="add-entity-button"
          onClick={() => nextEmpty.setValue(EXTRA_LINE_DEFAULTS[nextEmpty.key])}
        >
          + Add Line
        </button>
      )}
    </>
  );
}

// Up to 2 extra planes for Plane & Plane, on top of the always-present plane1/plane2.
function ExtraPlanes({ plane3, setPlane3, plane4, setPlane4 }) {
  const slots = [
    { key: "plane3", label: "Plane 3", color: "var(--vec-c)", value: plane3, setValue: setPlane3 },
    { key: "plane4", label: "Plane 4", color: "var(--vec-d)", value: plane4, setValue: setPlane4 },
  ];
  const nextEmpty = slots.find((s) => !s.value);

  return (
    <>
      {slots.map((s) =>
        s.value ? (
          <div className="removable-entity" key={s.key}>
            <PlaneInputs label={s.label} color={s.color} plane={s.value} onChange={s.setValue} />
            <button
              type="button"
              className="remove-entity-button"
              onClick={() => s.setValue(null)}
              aria-label={`Remove ${s.label}`}
            >
              ×
            </button>
          </div>
        ) : null
      )}
      {nextEmpty && (
        <button
          type="button"
          className="add-entity-button"
          onClick={() => nextEmpty.setValue(EXTRA_PLANE_DEFAULTS[nextEmpty.key])}
        >
          + Add Plane
        </button>
      )}
    </>
  );
}

// Line & Plane's extras are a shared pool of up to 2 slots — each one can
// independently be an extra line or an extra plane, so there are 4 possible
// named slots but at most 2 are ever filled at once. Color (vec-c/vec-d) is
// assigned by a fixed slot priority (lines before planes) among whichever
// slots are currently filled — simple and collision-free, though a slot's
// color can shift if a higher-priority slot gets filled or cleared later.
function LinePlaneExtras({ lpLine1, setLpLine1, lpLine2, setLpLine2, lpPlane1, setLpPlane1, lpPlane2, setLpPlane2 }) {
  const lineSlots = [
    { key: "lpLine1", label: "Extra Line 1", value: lpLine1, setValue: setLpLine1 },
    { key: "lpLine2", label: "Extra Line 2", value: lpLine2, setValue: setLpLine2 },
  ];
  const planeSlots = [
    { key: "lpPlane1", label: "Extra Plane 1", value: lpPlane1, setValue: setLpPlane1 },
    { key: "lpPlane2", label: "Extra Plane 2", value: lpPlane2, setValue: setLpPlane2 },
  ];
  const filledInOrder = [...lineSlots, ...planeSlots].filter((s) => s.value);
  const colorOf = (key) => (filledInOrder.findIndex((s) => s.key === key) === 0 ? "var(--vec-c)" : "var(--vec-d)");
  const filledCount = filledInOrder.length;
  const canAdd = filledCount < 2;
  const nextEmptyLine = lineSlots.find((s) => !s.value);
  const nextEmptyPlane = planeSlots.find((s) => !s.value);

  return (
    <>
      {lineSlots.map((s) =>
        s.value ? (
          <div className="removable-entity" key={s.key}>
            <LineInputs label={s.label} color={colorOf(s.key)} line={s.value} onChange={s.setValue} />
            <button
              type="button"
              className="remove-entity-button"
              onClick={() => s.setValue(null)}
              aria-label={`Remove ${s.label}`}
            >
              ×
            </button>
          </div>
        ) : null
      )}
      {planeSlots.map((s) =>
        s.value ? (
          <div className="removable-entity" key={s.key}>
            <PlaneInputs label={s.label} color={colorOf(s.key)} plane={s.value} onChange={s.setValue} />
            <button
              type="button"
              className="remove-entity-button"
              onClick={() => s.setValue(null)}
              aria-label={`Remove ${s.label}`}
            >
              ×
            </button>
          </div>
        ) : null
      )}
      {canAdd && (
        <div className="add-entity-row">
          {nextEmptyLine && (
            <button
              type="button"
              className="add-entity-button"
              onClick={() => nextEmptyLine.setValue(LP_LINE_DEFAULTS[nextEmptyLine.key])}
            >
              + Add Line
            </button>
          )}
          {nextEmptyPlane && (
            <button
              type="button"
              className="add-entity-button"
              onClick={() => nextEmptyPlane.setValue(LP_PLANE_DEFAULTS[nextEmptyPlane.key])}
            >
              + Add Plane
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default function ControlPanel3D({
  mode,
  line1,
  setLine1,
  line2,
  setLine2,
  line3,
  setLine3,
  line4,
  setLine4,
  plane1,
  setPlane1,
  plane2,
  setPlane2,
  plane3,
  setPlane3,
  plane4,
  setPlane4,
  lpLine1,
  setLpLine1,
  lpLine2,
  setLpLine2,
  lpPlane1,
  setLpPlane1,
  lpPlane2,
  setLpPlane2,
  point1,
  setPoint1,
  planePlaneView,
  setPlanePlaneView,
  linePlaneView,
  setLinePlaneView,
  lineLineView,
  setLineLineView,
  pointLineView,
  setPointLineView,
  pointPlaneView,
  setPointPlaneView,
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

            <LinePlaneExtras
              lpLine1={lpLine1}
              setLpLine1={setLpLine1}
              lpLine2={lpLine2}
              setLpLine2={setLpLine2}
              lpPlane1={lpPlane1}
              setLpPlane1={setLpPlane1}
              lpPlane2={lpPlane2}
              setLpPlane2={setLpPlane2}
            />

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

            <ExtraLines line3={line3} setLine3={setLine3} line4={line4} setLine4={setLine4} />

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

        {mode === "pointLine" && (
          <>
            <PointInputs label="Point" color="var(--vec-a)" point={point1} onChange={setPoint1} />
            <LineInputs label="Line" color="var(--vec-b)" line={line1} onChange={setLine1} />

            <ShowToggle
              value={pointLineView}
              onChange={setPointLineView}
              options={[
                { key: "distance", label: "Distance" },
                { key: "reflection", label: "Reflection" },
              ]}
            />
          </>
        )}

        {mode === "pointPlane" && (
          <>
            <PointInputs label="Point" color="var(--vec-a)" point={point1} onChange={setPoint1} />
            <PlaneInputs label="Plane" color="var(--vec-b)" plane={plane1} onChange={setPlane1} />

            <ShowToggle
              value={pointPlaneView}
              onChange={setPointPlaneView}
              options={[
                { key: "distance", label: "Distance" },
                { key: "reflection", label: "Reflection" },
              ]}
            />
          </>
        )}

        {mode === "planePlane" && (
          <>
            <PlaneInputs label="Plane 1" color="var(--vec-a)" plane={plane1} onChange={setPlane1} />
            <PlaneInputs label="Plane 2" color="var(--vec-b)" plane={plane2} onChange={setPlane2} />

            <ExtraPlanes plane3={plane3} setPlane3={setPlane3} plane4={plane4} setPlane4={setPlane4} />

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
