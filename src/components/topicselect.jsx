import { useNavigate } from "react-router-dom";
import "./topicselect.css";

const TOPICS = [
  {
    key: "vectors1",
    path: "/vectors1",
    label: "Vectors I",
    color: "var(--vec-a)",
    description: "2D vectors (Vectors I)",
  },
  {
    key: "vectors2",
    path: "/vectors2",
    label: "Vectors II",
    color: "var(--vec-b)",
    description: "3D vectors (Vectors II)",
  },
];

export default function TopicSelect() {
  const navigate = useNavigate();

  return (
    <div className="topic-select">
      <main className="topic-select-content">
        <p className="topic-select-eyebrow">TOPIC SELECTION</p>
        <h1 className="topic-select-title">Available Topics</h1>

        <div className="topic-cards">
          {TOPICS.map((t) => (
            <button
              key={t.key}
              className="topic-card"
              style={{ "--topic-color": t.color }}
              onClick={() => navigate(t.path)}
            >
              <span className="topic-card-label">{t.label}</span>
              <span className="topic-card-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
