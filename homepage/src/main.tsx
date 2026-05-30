import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoot from "./AppRoot";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { getAuthCallbackPathFromHash, getRouterBasename } from "./lib/runtime";
import "./index.css";
import "./workspace.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const callbackPathFromHash = getAuthCallbackPathFromHash();

if (callbackPathFromHash) {
  window.history.replaceState(null, "", callbackPathFromHash);
}

createRoot(root).render(
  <StrictMode>
      <BrowserRouter basename={getRouterBasename()}>
        <AuthProvider>
          <AppRoot />
        </AuthProvider>
      </BrowserRouter>
  </StrictMode>
);
