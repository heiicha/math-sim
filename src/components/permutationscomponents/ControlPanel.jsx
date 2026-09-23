import { CountingControls } from "./CountingTab";
import { PermutationsControls } from "./PermutationsTab";
import { CircularControls } from "./CircularTab";
import { CombinationsControls } from "./CombinationsTab";

export default function ControlPanel({ mode, countingState, setCountingState, permState, setPermState, circularState, setCircularState, combState, setCombState }) {
  return (
    <aside className="panel control-panel">
      {mode === "counting" && <CountingControls state={countingState} setState={setCountingState} />}
      {mode === "permutations" && <PermutationsControls state={permState} setState={setPermState} />}
      {mode === "circular" && <CircularControls state={circularState} setState={setCircularState} />}
      {mode === "combinations" && <CombinationsControls state={combState} setState={setCombState} />}
    </aside>
  );
}
