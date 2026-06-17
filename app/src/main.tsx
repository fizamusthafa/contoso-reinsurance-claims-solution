import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import PowerProvider from "./PowerProvider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PowerProvider>
      <App />
    </PowerProvider>
  </StrictMode>
);
