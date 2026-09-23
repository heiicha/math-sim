import { CountingReadout } from "./CountingTab";
import { PermutationsReadout } from "./PermutationsTab";
import { CircularReadout } from "./CircularTab";
import { CombinationsReadout } from "./CombinationsTab";

export default function ReadoutPanel({ mode, countingState, permState, circularState, combState }) {
  return (
    <aside className="panel readout-panel">
      <p className="readout-eyebrow">Results</p>
      {mode === "counting" && <CountingReadout state={countingState} />}
      {mode === "permutations" && <PermutationsReadout state={permState} />}
      {mode === "circular" && <CircularReadout state={circularState} />}
      {mode === "combinations" && <CombinationsReadout state={combState} />}
    </aside>
  );
}
