import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// Guard against reload loops when a new service worker activates
let refreshing = false;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    const lastReload = Number(
      sessionStorage.getItem("pwa_sw_last_reload") || 0,
    );
    const now = Date.now();
    // Guard against rapid reloads (within 5 seconds)
    if (now - lastReload < 5000) return;
    refreshing = true;
    sessionStorage.setItem("pwa_sw_last_reload", String(now));
    window.location.reload();
  });
}

// Auto-update Service Worker registration with 60s periodic check and foreground visibility check
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // When a new SW is waiting or needs refresh, trigger immediate activation
    updateSW(true);
  },

  onRegisteredSW(swScriptUrl, registration) {
    if (!registration) return;

    // Check for a new service worker version every 60 seconds
    setInterval(() => {
      if (navigator.onLine) {
        registration.update().catch((err) => {
          console.debug("[PWA] Periodic update check notice:", err);
        });
      }
    }, 60 * 1000);

    // Check for a new version whenever the app comes back to the foreground
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        registration.update().catch((err) => {
          console.debug("[PWA] Foreground update check notice:", err);
        });
      }
    });
  },
  onRegisterError(error) {
    if (import.meta.env.DEV) {
      console.debug(
        "[PWA Dev Notice] Service worker registration in dev mode:",
        error?.message || error,
      );
    } else {
      console.warn("[PWA] Service Worker registration failed:", error);
    }
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
