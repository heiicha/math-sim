import { createContext, useContext, useState } from "react";
import { getCookie, setCookie } from "./utils/cookies";

const HintPreferenceContext = createContext(null);
const COOKIE_KEY = "math-sim-hints-collapsed";

function getInitialPreference() {
  if (typeof document === "undefined") return false;
  return getCookie(COOKIE_KEY) === "1";
}

// Controls whether Hint sections start collapsed or expanded by default.
// The preference itself (not each hint's open/closed state) is persisted,
// in cookies, per the UAT spec — toggling it changes what happens on the
// *next* page load, it doesn't reach into hints already on screen.
export function HintPreferenceProvider({ children }) {
  const [collapsedByDefault, setCollapsedByDefault] = useState(getInitialPreference);

  const toggle = () => {
    setCollapsedByDefault((prev) => {
      const next = !prev;
      setCookie(COOKIE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <HintPreferenceContext.Provider value={{ collapsedByDefault, toggle }}>
      {children}
    </HintPreferenceContext.Provider>
  );
}

export function useHintPreference() {
  const ctx = useContext(HintPreferenceContext);
  if (!ctx) throw new Error("useHintPreference must be used within a HintPreferenceProvider");
  return ctx;
}
