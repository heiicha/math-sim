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
  const transition = document.startViewTransition(() => {
    flushSync(() => navigate(to));
  });
  // .ready rejects whenever the browser skips the transition itself (tab
  // backgrounded mid-click, a second navigation preempting this one, etc.)
  // — the navigation already went through via flushSync above either way,
  // so this is just the browser declining to animate it. Swallow it rather
  // than let it surface as an unhandled rejection.
  transition.ready.catch(() => {});
}
