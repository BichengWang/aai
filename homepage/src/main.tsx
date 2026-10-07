import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import AppRoot from "./AppRoot";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { getActiveApp, getAuthCallbackPathFromHash, getRouterBasename } from "./lib/runtime";
import "./index.css";
import "./workspace.css";
import "./lab.css";
import "./pages.css";
import "./home.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const callbackPathFromHash = getAuthCallbackPathFromHash();

if (callbackPathFromHash) {
  window.history.replaceState(null, "", callbackPathFromHash);
}

const app = (
  <StrictMode>
    <BrowserRouter basename={getRouterBasename()}>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// Static hosts serve a prerendered page (scripts/prerender.mjs) for its own
// path. Hydrate it only when this URL is that page in the marketing app; any
// other case (the workspace host, ?app=workspace, an auth callback rewritten
// above, a fallback copy) renders from scratch.
const prerenderedPath = root.dataset.prerendered;
const pathname = window.location.pathname.replace(/(.)\/+$/, "$1");

if (prerenderedPath && prerenderedPath === pathname && getActiveApp() === "marketing") {
  hydrateRoot(root, app);
} else {
  root.replaceChildren();
  document.documentElement.removeAttribute("data-app");
  createRoot(root).render(app);
}
