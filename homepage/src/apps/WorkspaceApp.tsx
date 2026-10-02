import { Route, Routes } from "react-router-dom";
import Account from "../pages/Account";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AuthCallback from "../pages/AuthCallback";
import OAuthConsent from "../pages/OAuthConsent";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import WorkspaceShell from "../components/WorkspaceShell";
import { ReviewRoute, ReviewSettingsRoute } from "../features/review/routes";
import { buildAppPath } from "../lib/runtime";
import WorkspaceEntry from "../pages/workspace/WorkspaceEntry";
import WorkspaceChat from "../pages/workspace/WorkspaceChat";
import WorkspaceKeys from "../pages/workspace/WorkspaceKeys";
import WorkspaceUsage from "../pages/workspace/WorkspaceUsage";

export default function WorkspaceApp() {
  return (
    <Routes>
      <Route path="/" element={<WorkspaceEntry />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route element={<PublicOnlyRoute authenticatedTo={buildAppPath("/chat", { app: "workspace" })} />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute redirectTo={buildAppPath("/login", { app: "workspace" })} />}>
        <Route element={<WorkspaceShell />}>
          <Route path="/chat" element={<WorkspaceChat />} />
          <Route path="/review" element={<ReviewRoute />} />
          <Route path="/review/settings" element={<ReviewSettingsRoute />} />
          <Route path="/keys" element={<WorkspaceKeys />} />
          <Route path="/usage" element={<WorkspaceUsage />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>
    </Routes>
  );
}
