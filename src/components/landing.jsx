import { useNavigate } from "react-router-dom";
import "./landing.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* <svg
        className="landing-vectors"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <line x1="100" y1="100" x2="170" y2="55" className="vec-line vec-a" />
        <polygon points="170,55 156,58 163,68" className="vec-head vec-a" />
        <line x1="100" y1="100" x2="60" y2="35" className="vec-line vec-b" />
        <polygon points="59.75,35 62.75,49 72.75,42" className="vec-head vec-b" />
        <path
          d="M 118 88 A 28 20 0 0 0 108 75"
          className="vec-arc"
          fill="none"
        />
      </svg> */}

      <main className="landing-content">
        <p className="landing-eyebrow">SIMULATIONS & PLAYGROUND</p>
        <h1 className="landing-title">Visualizing</h1>
        <h1 className="landing-title-2"> Mathematics</h1>
        <p className="landing-tagline">
          An open-source math project
        </p>
        <button className="landing-start" onClick={() => navigate("/topics")}>
          START
        </button>
      </main>
    </div>
  );
}
