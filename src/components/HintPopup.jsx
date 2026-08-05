import { useState } from "react";
import "./HintPopup.css";

// Persists dismissal per page (storageKey) so once a student closes the
// instructions, they stay closed on future visits too.
export default function HintPopup({ storageKey, children }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // private browsing / storage disabled — dismissal just won't persist
    }
  };

  return (
    <div className="hint-popup" role="note">
      <button className="hint-popup-close" onClick={dismiss} aria-label="Dismiss instructions">
        ×
      </button>
      <div className="hint-popup-body">{children}</div>
    </div>
  );
}
