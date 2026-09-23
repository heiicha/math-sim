import SliderField from "../statscomponents/SliderField";
import { fmt } from "../../utils/statsMath";

export default function CurveControls({ mean, setMean, sd, setSd, showEmpirical, setShowEmpirical, hideEmpirical = false }) {
  return (
    <div className="control-group">
      <p className="control-group-title">N(&mu;, &sigma;&sup2;)</p>
      <SliderField
        label="Mean, μ"
        value={mean}
        onChange={setMean}
        min={-50}
        max={200}
        step={1}
        color="var(--result)"
        format={(v) => fmt(v, 2)}
      />
      <SliderField
        label="Standard deviation, σ"
        value={sd}
        onChange={setSd}
        min={1}
        max={40}
        step={0.5}
        color="var(--accent)"
        format={(v) => fmt(v, 2)}
      />
      {!hideEmpirical && (
        <label className="nd-checkbox-row">
          <input type="checkbox" checked={showEmpirical} onChange={(e) => setShowEmpirical(e.target.checked)} />
          Shade the empirical-rule bands (&plusmn;1&sigma;, &plusmn;2&sigma;, &plusmn;3&sigma;)
        </label>
      )}
    </div>
  );
}
