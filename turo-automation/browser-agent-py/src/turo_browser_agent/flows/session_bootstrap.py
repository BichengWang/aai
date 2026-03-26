from __future__ import annotations

import time

from ..config import read_config
from ..page_state import page_looks_blocked, page_looks_login_required
from ..runtime import BrowserDependencyError, capture_page_artifacts, open_browser_page, prepare_runtime
from ..types import create_result

def run_session_bootstrap(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        with open_browser_page(config) as (_, context, page):
            page.goto(config.login_url, wait_until="domcontentloaded")

            deadline = time.time() + (config.bootstrap_wait_ms / 1000)
            authenticated = False
            status = "awaiting_manual_login"

            while time.time() < deadline:
                body_text = (page.locator("body").inner_text(timeout=3000) or "")[:2000].lower()
                if page_looks_blocked(page.title(), body_text):
                    status = "blocked"
                    break
                if not page_looks_login_required(page.title(), body_text):
                    authenticated = True
                    status = "authenticated"
                    break
                time.sleep(2)

            artifacts, artifact_warnings = capture_page_artifacts(page, config, "session-bootstrap")

            if authenticated and not config.use_persistent_profile:
                context.storage_state(path=str(config.storage_state_path))

            warnings: list[str] = []
            if status == "awaiting_manual_login":
                warnings.append(
                    "Browser opened, but login was not completed before timeout. Increase BROWSER_AGENT_BOOTSTRAP_WAIT_MS and retry."
                )
            elif status == "blocked":
                warnings.append("Turo appears to be blocking this browser session.")
            warnings.extend(artifact_warnings)

            return create_result(
                "session:bootstrap",
                {
                    **runtime,
                    "implemented": True,
                    "status": status,
                    "storageStateSaved": authenticated and not config.use_persistent_profile and not config.use_cdp_attach,
                    "persistentProfileReady": authenticated and config.use_persistent_profile,
                    "cdpAttachReady": authenticated and config.use_cdp_attach,
                    "artifacts": artifacts,
                    "finalUrl": page.url,
                },
                warnings=warnings,
                ok=status != "blocked",
            )
    except BrowserDependencyError as exc:
        return create_result(
            "session:bootstrap",
            {**runtime, "implemented": False, "dependencyReady": False},
            warnings=[str(exc)],
            ok=False,
        )
    except Exception as exc:
        return create_result(
            "session:bootstrap",
            {**runtime, "implemented": True, "error": str(exc)},
            warnings=["Session bootstrap failed before browser login completed."],
            ok=False,
        )
