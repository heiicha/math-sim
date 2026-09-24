import SliderField from "../statscomponents/SliderField";
import SegmentedControl from "../statscomponents/SegmentedControl";
import NumberField from "../statscomponents/NumberField";
import { TAIL_OPTIONS } from "./hypothesisMath";

const ALPHA_OPTIONS = [
  { value: 10, label: "10%" },
  { value: 5, label: "5%" },
  { value: 1, label: "1%" },
];

function FormulateControls({ values, setters }) {
  return (
    <div className="control-group">
      <p className="control-group-title">The claim</p>
      <div className="stat-field">
        <label className="stat-field-label" htmlFor="mu0-input">
          Claimed / hypothesised mean, μ₀
        </label>
        <NumberField id="mu0-input" className="stat-input" value={values.mu0} onChange={setters.setMu0} />
      </div>

      <SegmentedControl
        label="What is H₁ looking for?"
        value={values.tail}
        onChange={setters.setTail}
        options={TAIL_OPTIONS.map((t) => ({ value: t.value, label: `${t.symbol} ${t.hint}` }))}
      />
    </div>
  );
}

function RunControls({ values, setters }) {
  return (
    <>
      <div className="control-group">
        <p className="control-group-title">Sample data</p>
        <div className="stat-field">
          <label className="stat-field-label" htmlFor="xbar-input">
            Sample mean, x̄
          </label>
          <NumberField id="xbar-input" className="stat-input" step="0.1" value={values.xbar} onChange={setters.setXbar} />
        </div>

        <SliderField
          label="Sample size, n"
          value={values.n}
          onChange={setters.setN}
          min={2}
          max={150}
          step={1}
        />

        <SegmentedControl
          label="Is the population distribution normal?"
          value={values.isNormal ? "yes" : "no"}
          onChange={(v) => setters.setIsNormal(v === "yes")}
          options={[
            { value: "yes", label: "X ~ N(μ, σ²)" },
            { value: "no", label: "Not given / unknown" },
          ]}
        />

        <SegmentedControl
          label="Is σ² known?"
          value={values.varianceKnown ? "known" : "unknown"}
          onChange={(v) => setters.setVarianceKnown(v === "known")}
          options={[
            { value: "known", label: "σ² known" },
            { value: "unknown", label: "σ² unknown (use s)" },
          ]}
        />

        <div className="stat-field">
          <label className="stat-field-label" htmlFor="sd-input">
            {values.varianceKnown ? "Population standard deviation, σ" : "Sample standard deviation, s (unbiased estimate)"}
          </label>
          <NumberField
            id="sd-input"
            className="stat-input"
            step="0.1"
            min="0.0001"
            value={values.varianceKnown ? values.sigma : values.s}
            onChange={values.varianceKnown ? setters.setSigma : setters.setS}
          />
        </div>
      </div>

      <div className="control-group">
        <p className="control-group-title">Test setup</p>
        <SegmentedControl
          label="Level of significance, α"
          value={values.alphaPct}
          onChange={setters.setAlphaPct}
          options={ALPHA_OPTIONS}
        />
        <SliderField
          label="Custom α"
          value={values.alphaPct}
          onChange={setters.setAlphaPct}
          min={1}
          max={25}
          step={0.5}
          unit="%"
        />
      </div>
    </>
  );
}

function CaseControls({ values, setters }) {
  return (
    <div className="control-group">
      <p className="control-group-title">Describe the scenario</p>
      <p className="readout-def">
        These three facts about the population and sample decide which formula applies to X̄ — and
        whether a z-test is even in syllabus. They're shared with the "Run the Test" tab.
      </p>
      <SegmentedControl
        label="Is the population distribution normal?"
        value={values.isNormal ? "yes" : "no"}
        onChange={(v) => setters.setIsNormal(v === "yes")}
        options={[
          { value: "yes", label: "X ~ N(μ, σ²)" },
          { value: "no", label: "Not given / unknown" },
        ]}
      />
      <SegmentedControl
        label="Is σ² known?"
        value={values.varianceKnown ? "known" : "unknown"}
        onChange={(v) => setters.setVarianceKnown(v === "known")}
        options={[
          { value: "known", label: "σ² known" },
          { value: "unknown", label: "σ² unknown" },
        ]}
      />
      <SliderField label="Sample size, n" value={values.n} onChange={setters.setN} min={2} max={150} step={1} />
    </div>
  );
}

export default function ControlPanel({ mode, values, setters }) {
  return (
    <aside className="panel control-panel">
      {mode === "formulate" && <FormulateControls values={values} setters={setters} />}
      {mode === "run" && <RunControls values={values} setters={setters} />}
      {mode === "cases" && <CaseControls values={values} setters={setters} />}
    </aside>
  );
}
