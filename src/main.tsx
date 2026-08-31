/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerSW } from 'virtual:pwa-register';

import ErrorBoundary from "./components/ErrorBoundary";

// Register Service Worker with instant auto-reload on update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New deployment detected, refreshing for latest content...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for offline use.');
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
