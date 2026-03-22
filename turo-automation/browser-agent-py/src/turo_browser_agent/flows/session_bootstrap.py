from __future__ import annotations

import time

from ..config import read_config
from ..runtime import BrowserDependencyError, capture_page_artifacts, open_browser_page, prepare_runtime
from ..types import create_result


LOGIN_MARKERS = ["log in", "sign up", "continue with google"]



def run_session_bootstrap():
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
                if "you've been blocked" in body_text:
                    status = "blocked"
                    break
                if all(marker not in body_text for marker in LOGIN_MARKERS):
                    authenticated = True
                    status = "authenticated"
                    break
                time.sleep(2)

            artifacts = capture_page_artifacts(page, config, "session-bootstrap")

            if authenticated and not config.use_persistent_profile:
                context.storage_state(path=str(config.storage_state_path))

            warnings = None
            if status == "awaiting_manual_login":
                warnings = [
                    "Browser opened, but login was not completed before timeout. Increase BROWSER_AGENT_BOOTSTRAP_WAIT_MS and retry."
                ]
            elif status == "blocked":
                warnings = ["Turo appears to be blocking this browser session."]

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
