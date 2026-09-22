import StepControls from "./StepControls";
import { DEFAULT_STEPS, IDENTITY, applyStep, formatComposite, variableReplacement } from "./transformMath";

const MAX_STEPS = 5;

const STEP_LABELS = {
  translate: "+ Translate",
  scale: "+ Scale",
  reflect: "+ Reflect",
};

export default function SandboxSteps({ steps, setSteps }) {
  const addStep = (type) => {
    if (steps.length >= MAX_STEPS) return;
    setSteps([...steps, { ...DEFAULT_STEPS[type] }]);
  };

  const updateStep = (index, nextStep) => {
    const copy = steps.slice();
    copy[index] = nextStep;
    setSteps(copy);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // running (A,B,C,D) after each step, so every card can show its own
  // resultant equation as it's built up — same spirit as the notes' worked
  // examples tracking the graph after each numbered transformation.
  const cumulative = [];
  steps.reduce((state, step) => {
    const next = applyStep(state, step);
    cumulative.push(next);
    return next;
  }, IDENTITY);

  return (
    <div className="sandbox-steps">
      {steps.length === 0 && (
        <p className="sandbox-empty">Add a step below to start transforming y = f(x).</p>
      )}

      {steps.map((step, index) => (
        <div className="sandbox-step-card" key={index}>
          <div className="sandbox-step-header">
            <span className="sandbox-step-index">Step {index + 1}</span>
            <button
              type="button"
              className="remove-entity-button"
              onClick={() => removeStep(index)}
              aria-label={`Remove step ${index + 1}`}
            >
              ×
            </button>
          </div>
          <StepControls
            step={step}
            onChange={(next) => updateStep(index, next)}
            subjectLabel={index === 0 ? "y = f(x)" : `the graph from Step ${index}`}
          />
          <p className="sandbox-step-replacement">{variableReplacement(step)}</p>
          <p className="sandbox-step-result">→ {formatComposite(cumulative[index])}</p>
        </div>
      ))}

      {steps.length < MAX_STEPS ? (
        <div className="add-entity-row">
          {Object.keys(STEP_LABELS).map((type) => (
            <button key={type} type="button" className="add-entity-button" onClick={() => addStep(type)}>
              {STEP_LABELS[type]}
            </button>
          ))}
        </div>
      ) : (
        <p className="sandbox-max-note">Up to {MAX_STEPS} steps — remove one to add another.</p>
      )}
    </div>
  );
}
