import EquationInput from "./EquationInput";
import StepControls from "./StepControls";
import SandboxSteps from "./SandboxSteps";

export default function ControlPanel({
  mode,
  equation,
  setEquation,
  eqError,
  translateStep,
  setTranslateStep,
  scaleStep,
  setScaleStep,
  reflectStep,
  setReflectStep,
  sandboxSteps,
  setSandboxSteps,
}) {
  return (
    <aside className="panel control-panel">
      <EquationInput value={equation} onChange={setEquation} error={eqError} />

      {mode === "translate" && (
        <div className="single-step">
          <StepControls step={translateStep} onChange={setTranslateStep} />
        </div>
      )}

      {mode === "scale" && (
        <div className="single-step">
          <StepControls step={scaleStep} onChange={setScaleStep} />
        </div>
      )}

      {mode === "reflect" && (
        <div className="single-step">
          <StepControls step={reflectStep} onChange={setReflectStep} />
        </div>
      )}

      {mode === "sandbox" && <SandboxSteps steps={sandboxSteps} setSteps={setSandboxSteps} />}
    </aside>
  );
}
