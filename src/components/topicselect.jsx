import { useNavigate } from "react-router-dom";
import { navigateWithTransition } from "../viewTransitionNavigate.js";
import { BrandMark } from "./landing.jsx";
import "./landing.css";
import "./topicselect.css";

function Vectors2DIcon() {
  return (
    <svg viewBox="0 0 100 70" width="56" height="40" aria-hidden="true">
      <line x1="10" y1="60" x2="88" y2="60" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
      <polygon points="88,60 76,55 76,65" fill="var(--text)" />
      <line x1="10" y1="60" x2="68" y2="10" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
      <polygon points="68,10 56,15 64,24" fill="var(--text)" />
      <path d="M 38 60 A 18 18 0 0 0 32 45" stroke="#8b5cf6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Vectors3DIcon() {
  return (
    <svg viewBox="0 0 100 90" width="56" height="50" aria-hidden="true">
      <polygon points="18,72 18,22 62,22 62,72" fill="none" stroke="var(--text-dim)" strokeDasharray="3,3" strokeWidth="1.4" />
      <polygon points="34,54 34,8 82,8 82,54" fill="none" stroke="var(--text-dim)" strokeWidth="1.4" />
      <line x1="18" y1="22" x2="34" y2="8" stroke="var(--text-dim)" strokeDasharray="3,3" strokeWidth="1.4" />
      <line x1="18" y1="72" x2="34" y2="54" stroke="var(--text-dim)" strokeWidth="1.4" />
      <line x1="62" y1="22" x2="82" y2="8" stroke="var(--text-dim)" strokeWidth="1.4" />
      <line x1="62" y1="72" x2="82" y2="54" stroke="var(--text-dim)" strokeWidth="1.4" />
      <line x1="46" y1="54" x2="46" y2="14" stroke="#6990E4" strokeWidth="2" />
      <line x1="46" y1="54" x2="22" y2="64" stroke="#6990E4" strokeWidth="2" />
      <line x1="46" y1="54" x2="76" y2="54" stroke="#e0a23d" strokeWidth="2" />
      <line x1="46" y1="54" x2="68" y2="28" stroke="#E96B6A" strokeWidth="3" strokeLinecap="round" />
      <polygon points="68,28 65,39 58,32" fill="#E96B6A" />
    </svg>
  );
}

function GraphTransformationsIcon() {
  return (
    <svg viewBox="0 0 100 80" width="56" height="44" aria-hidden="true">
      <line x1="8" y1="70" x2="95" y2="70" stroke="var(--text-dim)" strokeWidth="1.4" />
      <line x1="15" y1="4" x2="15" y2="76" stroke="var(--text-dim)" strokeWidth="1.4" />
      <path d="M 15 55 Q 50 -6 88 55" stroke="#E96B6A" strokeWidth="2" fill="none" />
      <path d="M 20 66 Q 50 6 84 66" stroke="#6990E4" strokeWidth="2" fill="none" />
      <path d="M 26 70 Q 54 24 90 70" stroke="#5fae6b" strokeWidth="2" fill="none" />
    </svg>
  );
}

const TOPICS = [
  { key: "vectors1", path: "/vectors1", label: "2D Vectors", icon: <Vectors2DIcon /> },
  { key: "vectors2", path: "/vectors2", label: "3D Vectors", icon: <Vectors3DIcon /> },
  { key: "transformations", path: "/transformations", label: "Graph Transformations", icon: <GraphTransformationsIcon /> },
];

export default function TopicSelect() {
  const navigate = useNavigate();

  return (
    <div className="topic-select">
      <nav className="landing-nav">
        <div className="landing-brand">
          <BrandMark />
          <span>Math Sim</span>
        </div>
        <button type="button" className="landing-nav-link" onClick={() => navigateWithTransition(navigate, "/")}>
          Home
        </button>
      </nav>

      <main className="topic-select-main">
        <p className="landing-eyebrow">SIMULATIONS &amp; PLAYGROUND</p>
        <h1 className="topic-select-title">TOPICS AVAILABLE</h1>
        <p className="topic-select-section">Pure Maths</p>

        <div className="topic-grid">
          {TOPICS.map((t) => (
            <button key={t.key} className="topic-card" onClick={() => navigateWithTransition(navigate, t.path)}>
              <span className="topic-card-icon">{t.icon}</span>
              <span className="topic-card-label">{t.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
