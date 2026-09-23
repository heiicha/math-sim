import SliderField from "../statscomponents/SliderField";
import SegmentedControl from "../statscomponents/SegmentedControl";
import { fmt } from "../../utils/statsMath";

export default function InverseNormControls({ p, setP, tail, setTail }) {
  return (
    <div className="control-group">
      <p className="control-group-title">invNorm</p>
      <SliderField
        label="Area, p"
        value={p}
        onChange={setP}
        min={0.001}
        max={0.999}
        step={0.001}
        color="var(--result)"
        format={(v) => fmt(v, 3)}
      />
      <SegmentedControl
        label="Tail"
        value={tail}
        onChange={setTail}
        options={[
          { value: "left", label: "LEFT" },
          { value: "center", label: "CENTER" },
          { value: "right", label: "RIGHT" },
        ]}
      />
      <p className="note">
        LEFT solves P(X &le; a) = p. RIGHT solves P(X &ge; a) = p. CENTER solves the symmetric
        P(|X &minus; &mu;| &le; b) = p (Example 2.5.3/2.5.5 in the notes).
      </p>
    </div>
  );
}
