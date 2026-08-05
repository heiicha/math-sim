import { useLocation } from "react-router-dom";
import TransitionLink from "./TransitionLink";
import "./feedback.css";

export default function HomeButton() {
  const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <TransitionLink to="/">
      <button className="feedback-button">Home</button>
    </TransitionLink>
  );
}
