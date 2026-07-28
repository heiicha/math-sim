import { MODES } from "../vectors1";
import "./ControlPanel.css";

// The number boxes edit the vector's *components* (head - tail), not raw
// coordinates. Editing them keeps the tail fixed and moves the head so the
// component values match what was typed. z has no on-canvas handle — it's
// depth, only ever set here.
function ColumnVectorInput({ label, color, vector, onChange }) {
  const comp = {
    x: vector.head.x - vector.tail.x,
    y: vector.head.y - vector.tail.y,
    z: (vector.head.z || 0) - (vector.tail.z || 0),
  };

  const update = (key) => (e) => {
    const value = parseFloat(e.target.value);
    const nextComp = { ...comp, [key]: Number.isNaN(value) ? 0 : value };
    onChange({
      ...vector,
      head: {
        x: vector.tail.x + nextComp.x,
        y: vector.tail.y + nextComp.y,
        z: (vector.tail.z || 0) + nextComp.z,
      },
    });
  };

  return (
    <div className="vector-input-group">
      <span className="vector-label" style={{ color }}>
        {label}
      </span>
      <div className="bracket-pair">
        <div className="bracket bracket-left" style={{ borderColor: color }} />
        <div className="bracket-values">
          <input
            type="number"
            value={comp.x}
            onChange={update("x")}
            step="0.5"
            aria-label={`${label} x component`}
          />
          <input
            type="number"
            value={comp.y}
            onChange={update("y")}
            step="0.5"
            aria-label={`${label} y component`}
          />
          <input
            type="number"
            value={comp.z}
            onChange={update("z")}
            step="0.5"
            aria-label={`${label} z component`}
          />
        </div>
        <div className="bracket bracket-right" style={{ borderColor: color }} />
      </div>
    </div>
  );
}

function CrossShapeToggle({ crossShape, setCrossShape }) {
  return (
    <div className="shape-toggle">
      <p className="shape-toggle-label">Highlight area of</p>
      <div className="shape-toggle-buttons">
        <button
          className={crossShape === "parallelogram" ? "is-active" : ""}
          onClick={() => setCrossShape("parallelogram")}
        >
          Parallelogram
        </button>
        <button
          className={crossShape === "triangle" ? "is-active" : ""}
          onClick={() => setCrossShape("triangle")}
        >
          Triangle
        </button>
      </div>
    </div>
  );
}

function RatioInputs({ ratio, setRatio }) {
  const update = (key) => (e) => {
    const value = parseFloat(e.target.value);
    setRatio({ ...ratio, [key]: Number.isNaN(value) ? 0 : value });
  };
  return (
    <div className="ratio-inputs">
      <p className="ratio-label">AP : PB</p>
      <div className="ratio-fields">
        <input type="number" value={ratio.m} onChange={update("m")} step="1" aria-label="m" />
        <span>:</span>
        <input type="number" value={ratio.n} onChange={update("n")} step="1" aria-label="n" />
      </div>
      <p className="ratio-hint">
        P divides segment AB (from a's and b's heads) so that AP : PB = m : n.
      </p>
    </div>
  );
}

export default function ControlPanel({
  mode,
  setMode,
  vecA,
  setVecA,
  vecB,
  setVecB,
  crossShape,
  setCrossShape,
  ratio,
  setRatio,
}) {
  return (
    <aside className="panel control-panel">
      <nav className="mode-tabs" aria-label="Vector operation">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            className={`mode-tab ${mode === key ? "is-active" : ""}`}
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <div className="vector-inputs">
        <ColumnVectorInput label="a" color="var(--vec-a)" vector={vecA} onChange={setVecA} />
        <ColumnVectorInput label="b" color="var(--vec-b)" vector={vecB} onChange={setVecB} />
      </div>

      {mode === "cross" && (
        <CrossShapeToggle crossShape={crossShape} setCrossShape={setCrossShape} />
      )}

      {mode === "ratio" && <RatioInputs ratio={ratio} setRatio={setRatio} />}
    </aside>
  );
}
