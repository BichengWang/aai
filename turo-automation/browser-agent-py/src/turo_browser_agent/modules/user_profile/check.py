from __future__ import annotations

from ...config import read_config
from ...js_fragments import build_js_extract
from ...page_state import page_looks_blocked, page_looks_login_required
from ...parsers import normalize_profile_snapshot
from ...runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    prepare_runtime,
    read_page_body_text,
)
from ...types import create_result

PROFILE_URL = "https://turo.com/us/en/account"


JS_EXTRACT = build_js_extract(
    r"""
  const headings = Array.from(inMain.querySelectorAll('h1, h2, h3, h4'))
    .map((el) => clean(el.innerText))
    .filter(Boolean);
  const linkTexts = Array.from(inMain.querySelectorAll('a, button, li, p, span'))
    .map((el) => clean(el.innerText))
    .filter(Boolean)
    .filter((value) => /account|profile|host|guest|vehicle|trip|setting|switch to guest|sign out|log out|identity|email|name/i.test(value));

  return { headings, linkTexts };
}
"""
)


def run_profile_check(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        storage_state = None if config.use_persistent_profile else str(config.storage_state_path)
        with open_browser_page(config, storage_state=storage_state) as (_, _, page):
            try:
                response = page.goto(PROFILE_URL, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass

                title = page.title()
                url = page.url
                body_text, body_warnings = read_page_body_text(page, limit=6000)

                if page_looks_blocked(title, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "profile-check-blocked")
                    return create_result(
                        "profile:check",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "blocked",
                            "title": title,
                            "finalUrl": url,
                            "profileUrl": PROFILE_URL,
                            "httpStatus": response.status if response else None,
                            "signals": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Turo appears to be blocking this browser session.", *artifact_warnings],
                    )

                if page_looks_login_required(title, url, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "profile-check-login-required")
                    return create_result(
                        "profile:check",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "login_required",
                            "title": title,
                            "finalUrl": url,
                            "profileUrl": PROFILE_URL,
                            "httpStatus": response.status if response else None,
                            "signals": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Profile page requires a logged-in host browser session.", *artifact_warnings],
                    )

                raw_snapshot = page.evaluate(JS_EXTRACT)
                profile = normalize_profile_snapshot(raw_snapshot, url, body_text)
                artifacts, artifact_warnings = capture_page_artifacts(page, config, "profile-check")

                warnings: list[str] = []
                if not profile["signals"]:
                    warnings.append("Profile page loaded but no account or identity signals were extracted with the current parser.")
                warnings.extend(body_warnings)
                warnings.extend(artifact_warnings)

                return create_result(
                    "profile:check",
                    {
                        **runtime,
                        "implemented": True,
                        "status": "ok",
                        "title": title,
                        "finalUrl": url,
                        "profileUrl": PROFILE_URL,
                        "httpStatus": response.status if response else None,
                        "profile": profile,
                        "artifacts": artifacts,
                    },
                    warnings=warnings,
                )
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "profile-check",
                    "Profile check flow failed.",
                )
                return create_result(
                    "profile:check",
                    {
                        **runtime,
                        "implemented": True,
                        "error": str(exc),
                        "artifacts": error_artifacts,
                    },
                    warnings=error_warnings,
                    ok=False,
                )
    except BrowserDependencyError as exc:
        return create_result(
            "profile:check",
            {**runtime, "implemented": False},
            warnings=[str(exc)],
            ok=False,
        )
