import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./theme.jsx";
import { HintPreferenceProvider } from "./hintPreference.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <HintPreferenceProvider>
        <BrowserRouter basename="/math-sim">
          <App />
        </BrowserRouter>
      </HintPreferenceProvider>
    </ThemeProvider>
  </StrictMode>
);