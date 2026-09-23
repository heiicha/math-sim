import {
  DEFINITIONS,
  RESULT_TEXT,
  IDENTITY,
  applyStep,
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

// Renders every intermediate equation left-to-right — the panel spans the
// full page width, so rather than only stating the final equation, each
// step's node shows what it replaced to get there.
function EquationChain({ steps, hasEquation }) {
  if (!hasEquation) {
    return (
      <div className="eq-chain">
        <div className="eq-chain-node">
          <span className="eq-chain-node-label">Start</span>
          <span className="eq-chain-node-eq">—</span>
        </div>
      </div>
    );
  }

  let state = IDENTITY;
  const nodes = [{ label: "Start", eq: "y = f(x)" }];
  steps.forEach((step, i) => {
    state = applyStep(state, step);
    nodes.push({
      label: i === steps.length - 1 ? "Final equation" : `After step ${i + 1}`,
      eq: formatComposite(state),
    });
  });

  return (
    <div className="eq-chain">
      {nodes.map((node, i) => (
        <div key={i} style={{ display: "contents" }}>
          {i > 0 && (
            <div className="eq-chain-link">
              <span className="eq-chain-link-replacement">{variableReplacement(steps[i - 1])}</span>
              <span className="eq-chain-link-glyph">&#8594;</span>
            </div>
          )}
          <div className={`eq-chain-node ${i === nodes.length - 1 ? "is-final" : ""}`}>
            <span className="eq-chain-node-label">{node.label}</span>
            <span className="eq-chain-node-eq">{node.eq}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SingleTransformReadout({ type, step, hasEquation }) {
  const axis = step.axis;
  return (
    <>
      <p className="readout-def">{DEFINITIONS[type]}</p>
      <p className="formula">{describeStep(step)}</p>
      <EquationChain steps={[step]} hasEquation={hasEquation} />
      <Condition text={RESULT_TEXT[type][axis]} />
    </>
  );
}

function SandboxReadout({ steps, hasEquation }) {
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
        <>
          <ol className="sandbox-summary">
            {steps.map((step, i) => (
              <li key={i}>{describeStep(step, i === 0 ? "y = f(x)" : `the graph from Step ${i}`)}</li>
            ))}
          </ol>
          <EquationChain steps={steps} hasEquation={hasEquation} />
        </>
      )}
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
