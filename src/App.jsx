import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/landing";
import TopicSelect from "./components/topicselect";
import Vectors1 from "./components/vectors1";
import Vectors2 from "./components/vectors2";
import FeedbackButton from "./components/feedback";
import HomeButton from "./components/HomeButton";
import "./components/corner-buttons.css";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/topics" element={<TopicSelect />} />
        <Route path="/vectors1" element={<Vectors1 />} />
        <Route path="/vectors2" element={<Vectors2 />} />
      </Routes>

      <div className="corner-button corner-button-left">
        <FeedbackButton />
      </div>
      <div className="corner-button corner-button-right">
        <HomeButton />
      </div>
    </>
  );
}