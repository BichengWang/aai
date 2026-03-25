from __future__ import annotations

from ..config import read_config
from ..runtime import BrowserDependencyError, capture_page_artifacts, open_browser_page, prepare_runtime
from ..types import create_result

def run_health_smoke(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        with open_browser_page(config) as (_, _, page):
            response = page.goto(config.base_url, wait_until="domcontentloaded")
            try:
                page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
            except Exception:
                pass
            title = page.title()
            url = page.url
            body_text = (page.locator("body").inner_text(timeout=5000) or "")[:500]
            blocked = "blocked" in title.lower() or "you've been blocked" in body_text.lower()
            artifacts, artifact_warnings = capture_page_artifacts(page, config, "health-smoke")

            warnings: list[str] = []
            if blocked:
                warnings.append("Turo appears to be blocking this browser session.")
            warnings.extend(artifact_warnings)

            return create_result(
                "health:smoke",
                {
                    **runtime,
                    "implemented": True,
                    "reachable": response is not None,
                    "httpStatus": response.status if response else None,
                    "title": title,
                    "finalUrl": url,
                    "blocked": blocked,
                    "artifacts": artifacts,
                },
                warnings=warnings,
            )
    except BrowserDependencyError as exc:
        return create_result(
            "health:smoke",
            {**runtime, "implemented": False, "dependencyReady": False},
            warnings=[str(exc)],
            ok=False,
        )
    except Exception as exc:
        return create_result(
            "health:smoke",
            {**runtime, "implemented": True, "reachable": False, "error": str(exc)},
            warnings=["Health smoke failed while opening Turo."],
            ok=False,
        )
