import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { buildAppPath, buildWorkspaceUrl } from "../lib/runtime";

function WorkspaceNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={buildAppPath(to, { app: "workspace" })}
      className={({ isActive }) => `workspace-nav-link${isActive ? " active" : ""}`}
      end={to !== "/review"}
    >
      {label}
    </NavLink>
  );
}

export default function WorkspaceShell() {
  const { profile, signOut, user } = useAuth();

  return (
    <div className="workspace-app-shell">
      <aside className="workspace-sidebar lab-night">
        <Link className="text-link workspace-back-link" to={buildAppPath("/", { app: "marketing" })}>
          <span aria-hidden="true">←</span> Back to home
        </Link>
        <div className="workspace-brand-block">
          <span className="pill">Altair Workspace</span>
          <h1>Managed LLM routing</h1>
          <p>
            Bring your provider keys once. Altair validates, routes, tracks usage, and keeps chat on a managed key.
          </p>
        </div>
        <nav className="workspace-nav">
          <WorkspaceNavLink to="/chat" label="Chat" />
          <WorkspaceNavLink to="/review" label="Review" />
          <WorkspaceNavLink to="/keys" label="Keys" />
          <WorkspaceNavLink to="/usage" label="Usage" />
          <WorkspaceNavLink to="/account" label="Account" />
        </nav>
        <div className="workspace-profile-card">
          <p className="workspace-profile-name">{profile?.full_name ?? user?.email ?? "Altair user"}</p>
          <p className="workspace-profile-email">{user?.email ?? "No email found"}</p>
          <a className="text-link" href={buildWorkspaceUrl("/chat")}>
            Refresh workspace
          </a>
          <button className="button ghost" type="button" onClick={() => void signOut()}>
            Log out
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <Outlet />
      </div>
    </div>
  );
}
