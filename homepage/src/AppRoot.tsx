import { Suspense, lazy } from "react";
import App from "./App";
import { useLocation } from "react-router-dom";
import { detectActiveApp } from "./lib/runtime";

// Marketing visitors never need the signed-in workspace (chat, keys, usage,
// review tool), so it loads only when the workspace app is active.
const WorkspaceApp = lazy(() => import("./apps/WorkspaceApp"));

export default function AppRoot() {
  const location = useLocation();
  const activeApp = detectActiveApp({
    hostname: window.location.hostname,
    origin: window.location.origin,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  });

  return activeApp === "workspace" ? (
    <Suspense fallback={null}>
      <WorkspaceApp />
    </Suspense>
  ) : (
    <App />
  );
}
