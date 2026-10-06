import { useState } from "react";
import { usePageTitle } from "../lib/usePageChrome";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  appendNextSearchParam,
  buildAppPath,
  buildOAuthConsentPath,
  getDefaultSignedInPath,
  resolveRedirectPath,
} from "../lib/runtime";
import { getAuthErrorMessage, getMissingConfigMessage } from "../lib/supabase";

export default function Login() {
  usePageTitle("Log in");
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { authConfigured, authError, clearAuthError, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const authorizationId = searchParams.get("authorization_id")?.trim() ?? "";

  const from = authorizationId
    ? buildOAuthConsentPath(authorizationId)
    : resolveRedirectPath(
        searchParams.get("next") ?? (typeof location.state?.from === "string" ? location.state.from : null),
        getDefaultSignedInPath()
      );

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setMessage(null);
    setSubmitting(true);

    try {
      await signInWithGoogle(from);
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
      setSubmitting(false);
    }
  };

  const effectiveMessage = message ?? authError;
  const switchPath = authorizationId
    ? `${appendNextSearchParam(buildAppPath("/register"), from)}&authorization_id=${encodeURIComponent(authorizationId)}`
    : appendNextSearchParam(buildAppPath("/register"), from);

  return (
    <section className="lab-page lab-auth">
      <div className="container lab-grid lab-auth-grid">
        <div className="lab-auth-copy">
          <p className="lab-kicker lab-micro">
            <span>Account</span>
            <span className="lab-kicker-sep" aria-hidden="true">
              /
            </span>
            <span>Login</span>
          </p>
          <h1 className="lab-h1">Welcome back to Altair</h1>
          <p className="lab-lede">
            Continue with Google OAuth to access your account and resume any pending authorization.
          </p>
          <ol className="lab-ruled lab-ruled--numbered" role="list">
            <li>
              <span className="lab-micro" aria-hidden="true">01</span>
              <span>Single OAuth sign-in flow across marketing and workspace access</span>
            </li>
            <li>
              <span className="lab-micro" aria-hidden="true">02</span>
              <span>Supabase-managed session handling and callback recovery</span>
            </li>
            <li>
              <span className="lab-micro" aria-hidden="true">03</span>
              <span>Automatic return to the OAuth consent screen when an app requested access</span>
            </li>
          </ol>
        </div>
        <div className="lab-auth-card">
          <p className="lab-micro lab-auth-card-head">Sign in · Google OAuth</p>
          {!authConfigured ? (
            <p className="lab-notice lab-notice--warning">{getMissingConfigMessage()}</p>
          ) : null}
          {effectiveMessage ? (
            <p className="lab-notice lab-notice--error" role="alert">
              {effectiveMessage}
            </p>
          ) : null}
          {authorizationId ? (
            <p className="lab-notice lab-notice--success">
              Sign in first, then we will send you to the Altair consent screen to finish authorization.
            </p>
          ) : null}
          <button
            className="lab-btn lab-btn--primary lab-btn--block"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting || !authConfigured}
          >
            {submitting ? "Redirecting to Google..." : "Continue with Google"}
          </button>
          <p className="lab-auth-switch">
            Need a new account?{" "}
            <Link className="lab-link" to={switchPath} state={{ from }}>
              Register with Google
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
