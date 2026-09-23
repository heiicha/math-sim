import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/landing";
import TopicSelect from "./components/topicselect";
import Vectors1 from "./components/vectors1";
import Vectors2 from "./components/vectors2";
import Transformations from "./components/transformations";
import Permutations from "./components/permutations";
import NormalDistribution from "./components/normaldistribution";
import HypothesisTesting from "./components/hypothesistesting";
import FeedbackButton from "./components/feedback";
import HomeButton from "./components/HomeButton";
import ThemeToggle from "./components/ThemeToggle";
import "./components/corner-buttons.css";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/topics" element={<TopicSelect />} />
        <Route path="/vectors1" element={<Vectors1 />} />
        <Route path="/vectors2" element={<Vectors2 />} />
        <Route path="/transformations" element={<Transformations />} />
        <Route path="/permutations" element={<Permutations />} />
        <Route path="/normaldistribution" element={<NormalDistribution />} />
        <Route path="/hypothesistesting" element={<HypothesisTesting />} />
      </Routes>

      <div className="corner-button corner-button-left">
        <FeedbackButton />
      </div>
      <div className="corner-button corner-button-right">
        <HomeButton />
      </div>
      <div className="corner-button corner-button-top-right">
        <ThemeToggle />
      </div>
    </>
  );
}