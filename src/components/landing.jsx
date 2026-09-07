import { useNavigate } from "react-router-dom";
import { navigateWithTransition } from "../viewTransitionNavigate.js";
import vectorsIImage from "../assets/vectorsI.jpg";
import vectorsIIImage from "../assets/vectorsII.jpg";
import vectors3Image from "../assets/vectors3.png";
import graphTransformationsImage from "../assets/graphtransformations.png";
import "./landing.css";

export function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <circle cx="10" cy="10" r="5" fill="var(--vec-a)" />
      <circle cx="10" cy="22" r="5" fill="var(--text)" />
      <circle cx="22" cy="10" r="5" fill="var(--text)" />
      <circle cx="22" cy="22" r="5" fill="var(--vec-b)" />
    </svg>
  );
}

function FloatingCard({ image, position }) {
  return (
    <div className={`floating-card floating-card-${position}`} aria-hidden="true">
      <img src={image} alt="" className="floating-card-image" />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const goToTopics = () => navigateWithTransition(navigate, "/topics");

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">
          <BrandMark />
          <span>Math Sim</span>
        </div>
        <button type="button" className="landing-nav-link" onClick={goToTopics}>
          Browse topics
        </button>
      </nav>

      <main className="landing-content">
        <p className="landing-eyebrow">SIMULATIONS &amp; PLAYGROUND</p>
        <h1 className="landing-title">Visualizing</h1>
        <h1 className="landing-title-2">Mathematics</h1>
        <p className="landing-tagline">An open-source math project.</p>
        <button type="button" className="landing-start" onClick={goToTopics}>
          Start exploring
        </button>
      </main>

      <FloatingCard image={vectorsIImage} position="vectors" />
      <FloatingCard image={vectorsIIImage} position="cube" />
      <FloatingCard image={vectors3Image} position="vectors3" />
      <FloatingCard image={graphTransformationsImage} position="transform" />
    </div>
  );
}
