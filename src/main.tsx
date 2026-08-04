import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@nicecxone/lyra-ui/styles";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* basename matches vite.config.ts's `base` so client-side routes resolve
        correctly under the GitHub Pages project path (/Outbound-Campaigns/) */}
    <BrowserRouter basename="/Outbound-Campaigns">
      <App />
    </BrowserRouter>
  </StrictMode>
);
