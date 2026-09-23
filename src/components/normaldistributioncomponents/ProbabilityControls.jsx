import SegmentedControl from "../statscomponents/SegmentedControl";
import { fmt } from "../../utils/statsMath";

// Reused as-is on the "Normal Probabilities" tab, and again (compactly) on
// the "Linear Combinations" tab to find a probability on the resultant
// distribution — mirrors the GC's normalcdf(lower, upper, mu, sigma).
export default function ProbabilityControls({ mode, setMode, lower, setLower, upper, setUpper, compact = false }) {
  return (
    <div className={compact ? "control-group nd-compact" : "control-group"}>
      {!compact && <p className="control-group-title">normalcdf</p>}
      <SegmentedControl
        label="Bound type"
        value={mode}
        onChange={setMode}
        options={[
          { value: "lower", label: "X ≤ b" },
          { value: "upper", label: "X ≥ a" },
          { value: "between", label: "a ≤ X ≤ b" },
        ]}
      />
      {mode !== "lower" && (
        <div className="stat-field">
          <span className="stat-field-label">Lower bound, a</span>
          <input
            type="number"
            className="stat-input"
            value={lower}
            step="0.5"
            onChange={(e) => setLower(parseFloat(e.target.value))}
          />
        </div>
      )}
      {mode !== "upper" && (
        <div className="stat-field">
          <span className="stat-field-label">Upper bound, b</span>
          <input
            type="number"
            className="stat-input"
            value={upper}
            step="0.5"
            onChange={(e) => setUpper(parseFloat(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}

export function boundsSummaryLabel(mode, lower, upper) {
  if (mode === "lower") return `X ≤ ${fmt(upper, 3)}`;
  if (mode === "upper") return `X ≥ ${fmt(lower, 3)}`;
  return `${fmt(lower, 3)} ≤ X ≤ ${fmt(upper, 3)}`;
}
