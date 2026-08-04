import { Link, useLocation } from "react-router-dom";
import "./feedback.css";

export default function HomeButton() {
  const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <Link to="/">
      <button className="feedback-button">Home</button>
    </Link>
  );
}
