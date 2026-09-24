import { useLocation } from "react-router-dom";
import { useHintPreference } from "../hintPreference.jsx";
import "./ThemeToggle.css";

// Landing and topic-select have their own in-flow nav bar occupying the
// top-left corner (brand mark + title) and no Hint sections of their own —
// a fixed corner button there would sit right on top of that nav.
const PAGES_WITHOUT_HINTS = ["/", "/topics"];

export default function HintToggle() {
  const location = useLocation();
  const { collapsedByDefault, toggle } = useHintPreference();

  if (PAGES_WITHOUT_HINTS.includes(location.pathname)) return null;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={collapsedByDefault ? "Hints start collapsed — click to start them expanded" : "Hints start expanded — click to start them collapsed"}
      aria-pressed={collapsedByDefault}
      title={collapsedByDefault ? "Hints: start collapsed" : "Hints: start expanded"}
    >
      {collapsedByDefault ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9a3 3 0 1 1 4.2 2.73C12.47 12.05 12 12.72 12 13.5V14"
          />
          <line x1="12" y1="17" x2="12" y2="17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.5 2.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9a3 3 0 1 1 4.2 2.73C12.47 12.05 12 12.72 12 13.5V14"
          />
          <line x1="12" y1="17" x2="12" y2="17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
