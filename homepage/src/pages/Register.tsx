import { useState } from "react";
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

export default function Register() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { authConfigured, authError, clearAuthError, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authorizationId = searchParams.get("authorization_id")?.trim() ?? "";

  const from = authorizationId
    ? buildOAuthConsentPath(authorizationId)
    : resolveRedirectPath(
        searchParams.get("next") ?? (typeof location.state?.from === "string" ? location.state.from : null),
        getDefaultSignedInPath()
      );

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await signInWithGoogle(from);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setSubmitting(false);
    }
  };

  const effectiveError = errorMessage ?? authError;
  const switchPath = authorizationId
    ? `${appendNextSearchParam(buildAppPath("/login"), from)}&authorization_id=${encodeURIComponent(authorizationId)}`
    : appendNextSearchParam(buildAppPath("/login"), from);

  return (
    <section className="lab-page lab-auth">
      <div className="container lab-grid lab-auth-grid">
        <div className="lab-auth-copy">
          <p className="lab-kicker lab-micro">
            <span>Account</span>
            <span className="lab-kicker-sep" aria-hidden="true">
              /
            </span>
            <span>Register</span>
          </p>
          <h1 className="lab-h1">Create your Altair account</h1>
          <p className="lab-lede">
            Registration now uses Google OAuth only, so account creation and sign-in follow the same Supabase flow.
          </p>
          <h2 className="lab-micro lab-list-title">What you get</h2>
          <ol className="lab-ruled lab-ruled--numbered" role="list">
            <li>
              <span className="lab-micro" aria-hidden="true">01</span>
              <span>A single Google identity for account creation and future sign-in</span>
            </li>
            <li>
              <span className="lab-micro" aria-hidden="true">02</span>
              <span>Profile provisioning in Supabase as soon as the session is established</span>
            </li>
            <li>
              <span className="lab-micro" aria-hidden="true">03</span>
              <span>Automatic return to Altair OAuth consent when registration started from an app</span>
            </li>
          </ol>
        </div>
        <div className="lab-auth-card">
          <p className="lab-micro lab-auth-card-head">Register · Google OAuth</p>
          {!authConfigured ? (
            <p className="lab-notice lab-notice--warning">{getMissingConfigMessage()}</p>
          ) : null}
          {effectiveError ? (
            <p className="lab-notice lab-notice--error" role="alert">
              {effectiveError}
            </p>
          ) : null}
          {authorizationId ? (
            <p className="lab-notice lab-notice--success">
              Finish Google sign-in first. You will return to the Altair consent screen after registration completes.
            </p>
          ) : null}
          <button
            className="lab-btn lab-btn--primary lab-btn--block"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting || !authConfigured}
          >
            {submitting ? "Redirecting to Google..." : "Register with Google"}
          </button>
          <p className="lab-auth-switch">
            Already registered?{" "}
            <Link className="lab-link" to={switchPath} state={{ from }}>
              Sign in with Google
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
