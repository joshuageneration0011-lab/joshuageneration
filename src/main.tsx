/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerSW } from 'virtual:pwa-register';

import ErrorBoundary from "./components/ErrorBoundary";

registerSW({
  onNeedRefresh() {},
  onOfflineReady() {},
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
