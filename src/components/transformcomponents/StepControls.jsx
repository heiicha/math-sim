// Renders the note-formatted sentence for a single transform step, with the
// blanks as inline dropdowns/number inputs. Shared by the single-transform
// tabs (Translate/Scale/Reflect) and the Sandbox's per-step cards.
export default function StepControls({ step, onChange, subjectLabel = "y = f(x)" }) {
  const patch = (fields) => onChange({ ...step, ...fields });

  if (step.type === "translate") {
    return (
      <p className="step-sentence">
        Translate the graph of <span className="step-subject">{subjectLabel}</span> in the{" "}
        <select
          className="step-select"
          value={step.direction}
          onChange={(e) => patch({ direction: e.target.value })}
          aria-label="direction"
        >
          <option value="positive">positive</option>
          <option value="negative">negative</option>
        </select>{" "}
        <select
          className="step-select"
          value={step.axis}
          onChange={(e) => patch({ axis: e.target.value })}
          aria-label="axis"
        >
          <option value="x">x</option>
          <option value="y">y</option>
        </select>
        -direction by{" "}
        <input
          type="number"
          className="step-number"
          value={step.units}
          min="0"
          step="0.5"
          onChange={(e) => patch({ units: Math.max(0, parseFloat(e.target.value) || 0) })}
          aria-label="units"
        />{" "}
        units.
      </p>
    );
  }

  if (step.type === "scale") {
    return (
      <p className="step-sentence">
        Scale the graph of <span className="step-subject">{subjectLabel}</span> parallel to the{" "}
        <select
          className="step-select"
          value={step.axis}
          onChange={(e) => patch({ axis: e.target.value })}
          aria-label="axis"
        >
          <option value="x">x-axis</option>
          <option value="y">y-axis</option>
        </select>{" "}
        by a factor of{" "}
        <input
          type="number"
          className="step-number"
          value={step.factor}
          min="0.1"
          step="0.1"
          onChange={(e) => patch({ factor: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
          aria-label="scale factor"
        />
        .
      </p>
    );
  }

  if (step.type === "reflect") {
    return (
      <p className="step-sentence">
        Reflect the graph of <span className="step-subject">{subjectLabel}</span> in the{" "}
        <select
          className="step-select"
          value={step.axis}
          onChange={(e) => patch({ axis: e.target.value })}
          aria-label="axis"
        >
          <option value="x">x-axis</option>
          <option value="y">y-axis</option>
        </select>
        .
      </p>
    );
  }

  return null;
}
