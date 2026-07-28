import { useNavigate } from "react-router-dom";
import "./landing.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <div className="landing-grid" aria-hidden="true" />

      <svg
        className="landing-vectors"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <line x1="100" y1="100" x2="170" y2="55" className="vec-line vec-a" />
        <polygon points="170,55 156,58 163,68" className="vec-head vec-a" />
        <line x1="100" y1="100" x2="60" y2="35" className="vec-line vec-b" />
        <polygon points="60,35 68,46 55,49" className="vec-head vec-b" />
        <path
          d="M 118 90 A 22 22 0 0 0 108 69"
          className="vec-arc"
          fill="none"
        />
      </svg>

      <main className="landing-content">
        <p className="landing-eyebrow">SIMULATIONS & PLAYGROUND</p>
        <h1 className="landing-title">Visualizing</h1>
        <h1 className="landing-title-2"> Mathematics</h1>
        <p className="landing-tagline">
          An open-source math project / Made by Joan 25SH08
        </p>
        <button className="landing-start" onClick={() => navigate("/vectors1")}>
          Start
        </button>
      </main>
    </div>
  );
}