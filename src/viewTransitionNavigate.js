import { flushSync } from "react-dom";

// Wraps a react-router navigate() call in the native View Transitions API so
// route changes cross-fade instead of snapping instantly. flushSync forces
// the DOM update to happen synchronously inside the transition callback,
// which the browser needs in order to capture accurate before/after
// snapshots. Falls back to a plain navigate() in browsers that don't
// support the API yet (e.g. Firefox, older Safari).
export function navigateWithTransition(navigate, to) {
  if (!document.startViewTransition) {
    navigate(to);
    return;
  }
  document.startViewTransition(() => {
    flushSync(() => navigate(to));
  });
}
