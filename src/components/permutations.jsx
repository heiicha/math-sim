import { useState } from "react";
import ControlPanel from "./permutationscomponents/ControlPanel";
import CanvasPanel from "./permutationscomponents/CanvasPanel";
import ReadoutPanel from "./permutationscomponents/ReadoutPanel";
import { DEFAULT_COUNTING_STATE } from "./permutationscomponents/CountingTab";
import { DEFAULT_PERMUTATIONS_STATE } from "./permutationscomponents/PermutationsTab";
import { DEFAULT_CIRCULAR_STATE } from "./permutationscomponents/CircularTab";
import { DEFAULT_COMBINATIONS_STATE } from "./permutationscomponents/CombinationsTab";
import "./permutations.css";

export const MODES = {
  counting: {
    label: "Counting Principles",
    tagline: "The addition and multiplication principles: the two rules every other result in this topic is built from.",
  },
  permutations: {
    label: "Permutations in a Row",
    tagline: "Ordered arrangements of objects — with all objects distinct, repetition allowed, or some objects identical.",
  },
  circular: {
    label: "Circular Permutations",
    tagline: "Arranging n distinct objects around a circle, where rotations of the same arrangement are not counted twice.",
  },
  combinations: {
    label: "Combinations",
    tagline: "Unordered selections of r objects from n distinct objects — and how they relate back to permutations.",
  },
};

function Permutations() {
  const [mode, setMode] = useState("counting");

  const [countingState, setCountingState] = useState(DEFAULT_COUNTING_STATE);
  const [permState, setPermState] = useState(DEFAULT_PERMUTATIONS_STATE);
  const [circularState, setCircularState] = useState(DEFAULT_CIRCULAR_STATE);
  const [combState, setCombState] = useState(DEFAULT_COMBINATIONS_STATE);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="topic-header">Permutations &amp; Combinations</h1>
        <h1>{MODES[mode].label}</h1>
        <p className="tagline">{MODES[mode].tagline}</p>
      </header>

      <main className="layout">
        <div className="main-row">
          <ControlPanel
            mode={mode}
            countingState={countingState}
            setCountingState={setCountingState}
            permState={permState}
            setPermState={setPermState}
            circularState={circularState}
            setCircularState={setCircularState}
            combState={combState}
            setCombState={setCombState}
          />

          <CanvasPanel
            mode={mode}
            countingState={countingState}
            permState={permState}
            circularState={circularState}
            combState={combState}
          />
        </div>

        <nav className="panel mode-bar" aria-label="Topic segment">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              className={`mode-tab ${mode === key ? "is-active" : ""}`}
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
            >
              {m.label}
            </button>
          ))}
        </nav>

        <ReadoutPanel
          mode={mode}
          countingState={countingState}
          permState={permState}
          circularState={circularState}
          combState={combState}
        />
      </main>
    </div>
  );
}

export default Permutations;
