import { Link, useNavigate } from "react-router-dom";
import { navigateWithTransition } from "../viewTransitionNavigate.js";

// Drop-in replacement for react-router's <Link>, for internal routes only —
// renders a real <a> (so middle-click/ctrl-click/right-click still work
// normally) but intercepts plain left-clicks to run the navigation through
// the View Transitions API for a smooth cross-fade.
export default function TransitionLink({ to, onClick, ...rest }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigateWithTransition(navigate, to);
  };

  return <Link to={to} onClick={handleClick} {...rest} />;
}
