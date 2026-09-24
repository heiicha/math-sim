import HintPopup from "../HintPopup";
import { CountingVisual } from "./CountingTab";
import { PermutationsVisual } from "./PermutationsTab";
import { CircularVisual } from "./CircularTab";
import { CombinationsVisual } from "./CombinationsTab";

const HINTS = {
  counting: "Add options (either/or) or tasks (then) and watch the total update — addition sums the ways, multiplication chains them.",
  permutations: "Switch between distinct objects, repetition allowed, and some-identical to see how each changes the slot-filling method.",
  circular: "Drag the n slider and toggle whether seats are numbered — notice how numbering turns a circle back into a row.",
  combinations: "Slide n and r to move the highlighted cell along Pascal's triangle — that's ⁿCᵣ.",
};

export default function CanvasPanel({ mode, countingState, permState, circularState, combState }) {
  return (
    <section className="canvas-panel">
      {mode === "counting" && <CountingVisual state={countingState} />}
      {mode === "permutations" && <PermutationsVisual state={permState} />}
      {mode === "circular" && <CircularVisual state={circularState} />}
      {mode === "combinations" && <CombinationsVisual state={combState} />}
      <HintPopup>{HINTS[mode]}</HintPopup>
    </section>
  );
}
