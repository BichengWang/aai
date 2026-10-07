import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Enquiry from "./pages/Enquiry";
import ServiceDetail from "./pages/ServiceDetail";
import Services from "./pages/Services";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import AuthCallback from "./pages/AuthCallback";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import { useAuth } from "./context/AuthContext";
import { buildAppPath, buildWorkspaceUrl, getWorkspaceOrigin } from "./lib/runtime";
import { useHydrated, useRouteChangeReset } from "./lib/usePageChrome";

function AuthLinks() {
  const { loading, user, signOut } = useAuth();

  if (loading) {
    return <span className="nav-hint">Session...</span>;
  }

  if (user) {
    return (
      <>
        <Link to="/account">Account</Link>
        <button className="nav-action" type="button" onClick={() => void signOut()}>
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </>
  );
}

function WorkspaceLink({ children }: { children: string }) {
  const hydrated = useHydrated();

  // Prerendered HTML can't know the host it is served from; this path opens
  // the workspace on any host until the page is live.
  if (!hydrated) {
    return <a href="/?app=workspace">{children}</a>;
  }

  const sameOrigin = getWorkspaceOrigin(window.location) === window.location.origin;

  if (sameOrigin) {
    return <Link to={buildAppPath("/", { app: "workspace" })}>{children}</Link>;
  }

  return <a href={buildWorkspaceUrl("/")}>{children}</a>;
}

// The TradingAgents reports are served at /TradingAgents/ outside this app
// (functions/TradingAgents), so the link needs a full page load.
function ResearchLink() {
  return <a href="/TradingAgents/">Research</a>;
}

function LegacyReviewRedirect() {
  const { pathname } = useLocation();
  return <Navigate to={buildAppPath(pathname, { app: "workspace" })} replace />;
}

function BrandMark() {
  return (
    <svg
      className="lab-brand-mark"
      viewBox="0 0 20 20"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path
        d="M13.4 3.7 L10 9 L6.6 16.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".45"
        strokeWidth="1"
      />
      <circle cx="13.4" cy="3.7" r="2" />
      <circle cx="10" cy="9" r="3.2" />
      <circle cx="6.6" cy="16.5" r="2" />
    </svg>
  );
}

export default function App() {
  useRouteChangeReset("main-content");

  return (
    <div className="page page--lab">
      <header className="site-header site-header--lab lab-night">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="container nav">
          <Link className="brand" to="/">
            <BrandMark />
            Altair
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <NavLink to="/services">Services</NavLink>
            <ResearchLink />
            <NavLink to="/enquiry">Contact</NavLink>
            <WorkspaceLink>Workspace</WorkspaceLink>
            <AuthLinks />
          </nav>
        </div>
      </header>
      <main id="main-content" className="page-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/enquiry" element={<Enquiry />} />
          <Route path="/contact" element={<Navigate to="/enquiry" replace />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/oauth/consent" element={<OAuthConsent />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<Account />} />
          </Route>
          <Route path="/review" element={<LegacyReviewRedirect />} />
          <Route path="/review/settings" element={<LegacyReviewRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer footer--lab lab-night">
        <div className="container footer-grid">
          <div>
            <p className="brand">
              <BrandMark />
              Altair AI LLC
            </p>
            <address className="footer-contact">
              <a href="mailto:qx@altairworld.com">qx@altairworld.com</a>
              <span>San Francisco Bay Area</span>
              <span>Mon-Fri, 9am-6pm PST</span>
            </address>
          </div>
          <div className="footer-links">
            <Link to="/services">Services</Link>
            <ResearchLink />
            <Link to="/enquiry">Contact</Link>
            <WorkspaceLink>Workspace</WorkspaceLink>
            <AuthLinks />
          </div>
          <div>
            <p className="footer-meta">San Francisco Bay Area</p>
            <p className="footer-meta">© 2026 Altair AI LLC</p>
          </div>
        </div>
        <div className="container lab-footer-mark" aria-hidden="true">
          <span className="lab-footer-mark-word">Altair</span>
          <span className="lab-footer-mark-coord">
            α Aql · RA 19h 50m 47s · Dec +08° 52′ 06″
          </span>
        </div>
      </footer>
    </div>
  );
}
