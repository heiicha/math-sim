import {
  DEFINITIONS,
  RESULT_TEXT,
  IDENTITY,
  applyStep,
  composeSteps,
  describeStep,
  formatComposite,
  variableReplacement,
} from "./transformMath";

function Condition({ text }) {
  if (!text) return null;
  return (
    <p className="condition">
      <span className="condition-label">From the notes</span>
      {text}
    </p>
  );
}

function SingleTransformReadout({ type, step, hasEquation }) {
  const state = applyStep(IDENTITY, step);
  const axis = step.axis;
  return (
    <>
      <p className="readout-def">{DEFINITIONS[type]}</p>
      <p className="formula">{describeStep(step)}</p>
      <div className="result-row">
        <span>Variable replacement</span>
        <strong>{variableReplacement(step)}</strong>
      </div>
      <div className="result-row is-highlighted">
        <span>Resultant equation</span>
        <strong>{hasEquation ? formatComposite(state) : "—"}</strong>
      </div>
      <Condition text={RESULT_TEXT[type][axis]} />
    </>
  );
}

function SandboxReadout({ steps, hasEquation }) {
  const final = composeSteps(steps);
  return (
    <>
      <p className="readout-def">
        A sequence of transformations is applied to y = f(x) one step at a time, in order — each
        step's variable replacement is applied to the equation that resulted from the step before
        it. Swapping the order of two steps generally changes the resultant graph. (§2, Composite
        Transformations)
      </p>
      {steps.length === 0 ? (
        <p className="note">Add a step on the left to see its description and resultant equation here.</p>
      ) : (
        <ol className="sandbox-summary">
          {steps.map((step, i) => (
            <li key={i}>
              {describeStep(step, i === 0 ? "y = f(x)" : `the graph from Step ${i}`)}{" "}
              <span className="sandbox-summary-replacement">({variableReplacement(step)})</span>
            </li>
          ))}
        </ol>
      )}
      <div className="result-row is-highlighted">
        <span>Final resultant equation</span>
        <strong>{hasEquation ? formatComposite(final) : "—"}</strong>
      </div>
    </>
  );
}

export default function ReadoutPanel({
  mode,
  translateStep,
  scaleStep,
  reflectStep,
  sandboxSteps,
  hasEquation,
}) {
  return (
    <aside className="panel readout-panel">
      <p className="readout-eyebrow">Results</p>
      {mode === "translate" && (
        <SingleTransformReadout type="translate" step={translateStep} hasEquation={hasEquation} />
      )}
      {mode === "scale" && <SingleTransformReadout type="scale" step={scaleStep} hasEquation={hasEquation} />}
      {mode === "reflect" && (
        <SingleTransformReadout type="reflect" step={reflectStep} hasEquation={hasEquation} />
      )}
      {mode === "sandbox" && <SandboxReadout steps={sandboxSteps} hasEquation={hasEquation} />}
    </aside>
  );
}
