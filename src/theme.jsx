import { createContext, useContext, useLayoutEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "math-sim-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // useLayoutEffect (not useEffect) so the DOM attribute is updated
  // synchronously during commit, before descendants' passive effects run.
  // Scene3D reads CSS custom properties off this attribute via
  // getComputedStyle in its own useEffect(..., [theme]); passive effects
  // fire child-before-parent, so with a plain useEffect here Scene3D's
  // read would race ahead of this write and see the *previous* theme.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
