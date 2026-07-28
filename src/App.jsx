import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/landing";
import Vectors1 from "./components/vectors1";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/vectors1" element={<Vectors1 />} />
    </Routes>
  );
}