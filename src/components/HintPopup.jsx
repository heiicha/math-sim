import { useState } from "react";
import { useHintPreference } from "../hintPreference.jsx";
import "./HintPopup.css";

// Each Hint section can be collapsed/expanded on its own page — that toggle
// is just local component state. Whether a hint *starts* collapsed or
// expanded is governed by the app-wide preference (set via the in-app Hints
// toggle and persisted in cookies), read once at mount.
export default function HintPopup({ children }) {
  const { collapsedByDefault } = useHintPreference();
  const [open, setOpen] = useState(() => !collapsedByDefault);

  if (!open) {
    return (
      <button type="button" className="hint-popup-tab" onClick={() => setOpen(true)} aria-label="Show instructions">
        ? Hint
      </button>
    );
  }

  return (
    <div className="hint-popup" role="note">
      <button className="hint-popup-close" onClick={() => setOpen(false)} aria-label="Collapse instructions">
        ×
      </button>
      <div className="hint-popup-body">{children}</div>
    </div>
  );
}
