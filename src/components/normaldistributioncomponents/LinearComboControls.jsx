import SliderField from "../statscomponents/SliderField";
import SegmentedControl from "../statscomponents/SegmentedControl";
import ProbabilityControls from "./ProbabilityControls";
import { fmt } from "../../utils/statsMath";

export default function LinearComboControls({ combo, setCombo, prob, setProb }) {
  const patch = (fields) => setCombo({ ...combo, ...fields });

  return (
    <>
      <div className="control-group">
        <p className="control-group-title">X ~ N(&mu;&#8321;, &sigma;&#8321;&sup2;)</p>
        <SliderField label="μ₁" value={combo.mean1} onChange={(v) => patch({ mean1: v })} min={-50} max={200} step={1} color="var(--vec-a)" format={(v) => fmt(v, 2)} />
        <SliderField label="σ₁" value={combo.sd1} onChange={(v) => patch({ sd1: v })} min={1} max={40} step={0.5} color="var(--vec-a)" format={(v) => fmt(v, 2)} />
        <SliderField label="Coefficient, a" value={combo.a} onChange={(v) => patch({ a: v })} min={-5} max={5} step={0.5} color="var(--vec-a)" format={(v) => fmt(v, 2)} />
      </div>

      <div className="control-group">
        <p className="control-group-title">Y ~ N(&mu;&#8322;, &sigma;&#8322;&sup2;)</p>
        <SliderField label="μ₂" value={combo.mean2} onChange={(v) => patch({ mean2: v })} min={-50} max={200} step={1} color="var(--vec-b)" format={(v) => fmt(v, 2)} />
        <SliderField label="σ₂" value={combo.sd2} onChange={(v) => patch({ sd2: v })} min={1} max={40} step={0.5} color="var(--vec-b)" format={(v) => fmt(v, 2)} />
        <SliderField label="Coefficient, b" value={combo.b} onChange={(v) => patch({ b: v })} min={-5} max={5} step={0.5} color="var(--vec-b)" format={(v) => fmt(v, 2)} />
      </div>

      <div className="control-group">
        <p className="control-group-title">Overlay</p>
        <SegmentedControl
          label="Show alongside the result"
          value={combo.secondary}
          onChange={(v) => patch({ secondary: v })}
          options={[
            { value: "none", label: "None" },
            { value: "X", label: "X" },
            { value: "Y", label: "Y" },
          ]}
        />
      </div>

      <ProbabilityControls
        mode={prob.mode}
        setMode={(v) => setProb({ ...prob, mode: v })}
        lower={prob.lower}
        setLower={(v) => setProb({ ...prob, lower: v })}
        upper={prob.upper}
        setUpper={(v) => setProb({ ...prob, upper: v })}
      />
    </>
  );
}
