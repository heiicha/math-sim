import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/landing";
import Vectors1 from "./components/vectors1";
import Vectors2 from "./components/vectors2";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/vectors1" element={<Vectors1 />} />
      <Route path="/vectors2" element={<Vectors2 />} />
    </Routes>
  );
}