from __future__ import annotations

from ..config import read_config
from ..page_state import page_looks_blocked, page_looks_login_required
from ..runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    read_page_body_text,
)
from ..types import create_result

PROTECTED_TRIPS_URL = "https://turo.com/us/en/trips"

def run_session_check(args: list[str] | None = None):
    config = read_config()
    state_exists = config.storage_state_path.exists()

    if not config.use_persistent_profile and not config.use_cdp_attach and not state_exists:
        return create_result(
            "session:check",
            {
                "implemented": True,
                "stateFileExists": False,
                "status": "missing_state",
                "storageStatePath": str(config.storage_state_path),
                "artifactsDir": str(config.artifacts_dir),
            },
            warnings=["No storage state found; run session-bootstrap first."],
        )

    try:
        storage_state = None if config.use_persistent_profile else str(config.storage_state_path)
        with open_browser_page(config, storage_state=storage_state) as (_, context, page):
            try:
                response = page.goto(PROTECTED_TRIPS_URL, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass
                title = page.title()
                url = page.url
                cookies = context.cookies()
                body_text, body_warnings = read_page_body_text(page, limit=2000)

                blocked = page_looks_blocked(title, body_text)
                redirected_to_login = "/login" in url
                looks_logged_out = redirected_to_login or page_looks_login_required(title, body_text)
                status = "authenticated" if not blocked and not looks_logged_out else "login_required"
                if blocked:
                    status = "blocked"

                artifacts, artifact_warnings = capture_page_artifacts(page, config, "session-check")
                warnings: list[str] = []
                if status == "login_required":
                    warnings.append("Browser state exists, but Turo still appears to require login.")
                elif status == "blocked":
                    warnings.append("Turo appears to be blocking this browser session.")
                warnings.extend(body_warnings)
                warnings.extend(artifact_warnings)

                return create_result(
                    "session:check",
                    {
                        "implemented": True,
                        "stateFileExists": state_exists,
                        "usingPersistentProfile": config.use_persistent_profile,
                        "usingCdpAttach": config.use_cdp_attach,
                        "status": status,
                        "checkedUrl": PROTECTED_TRIPS_URL,
                        "storageStatePath": str(config.storage_state_path),
                        "userDataDir": str(config.user_data_dir),
                        "artifactsDir": str(config.artifacts_dir),
                        "title": title,
                        "finalUrl": url,
                        "httpStatus": response.status if response else None,
                        "cookieCount": len(cookies),
                        "artifacts": artifacts,
                    },
                    warnings=warnings,
                )
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "session-check",
                    "Session check failed while opening Turo with saved state.",
                )
                return create_result(
                    "session:check",
                    {
                        "implemented": True,
                        "stateFileExists": state_exists,
                        "status": "check_failed",
                        "storageStatePath": str(config.storage_state_path),
                        "error": str(exc),
                        "artifacts": error_artifacts,
                    },
                    warnings=error_warnings,
                    ok=False,
                )
    except BrowserDependencyError as exc:
        return create_result(
            "session:check",
            {
                "implemented": False,
                "stateFileExists": state_exists,
                "status": "dependency_missing",
                "storageStatePath": str(config.storage_state_path),
            },
            warnings=[str(exc)],
            ok=False,
        )
