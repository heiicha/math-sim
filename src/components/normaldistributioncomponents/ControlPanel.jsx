import CurveControls from "./CurveControls";
import ProbabilityControls from "./ProbabilityControls";
import InverseNormControls from "./InverseNormControls";
import LinearComboControls from "./LinearComboControls";

export default function ControlPanel({
  mode,
  mean,
  setMean,
  sd,
  setSd,
  showEmpirical,
  setShowEmpirical,
  prob,
  setProb,
  inv,
  setInv,
  combo,
  setCombo,
  comboProb,
  setComboProb,
}) {
  return (
    <div className="control-panel">
      {mode === "curve" && (
        <CurveControls mean={mean} setMean={setMean} sd={sd} setSd={setSd} showEmpirical={showEmpirical} setShowEmpirical={setShowEmpirical} />
      )}

      {mode === "probability" && (
        <>
          <CurveControls mean={mean} setMean={setMean} sd={sd} setSd={setSd} showEmpirical={false} setShowEmpirical={() => {}} hideEmpirical />
          <ProbabilityControls
            mode={prob.mode}
            setMode={(v) => setProb({ ...prob, mode: v })}
            lower={prob.lower}
            setLower={(v) => setProb({ ...prob, lower: v })}
            upper={prob.upper}
            setUpper={(v) => setProb({ ...prob, upper: v })}
          />
        </>
      )}

      {mode === "inverse" && (
        <>
          <CurveControls mean={mean} setMean={setMean} sd={sd} setSd={setSd} showEmpirical={false} setShowEmpirical={() => {}} hideEmpirical />
          <InverseNormControls p={inv.p} setP={(v) => setInv({ ...inv, p: v })} tail={inv.tail} setTail={(v) => setInv({ ...inv, tail: v })} />
        </>
      )}

      {mode === "linear" && (
        <LinearComboControls combo={combo} setCombo={setCombo} prob={comboProb} setProb={setComboProb} />
      )}
    </div>
  );
}
