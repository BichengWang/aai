from __future__ import annotations

from ...config import read_config
from ...page_state import page_looks_blocked
from ...runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    prepare_runtime,
    read_page_body_text,
)
from ...types import create_result


def run_health_smoke(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        with open_browser_page(config) as (_, _, page):
            try:
                response = page.goto(config.base_url, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass
                title = page.title()
                url = page.url
                body_text, body_warnings = read_page_body_text(page, limit=500)
                blocked = page_looks_blocked(title, body_text)
                artifacts, artifact_warnings = capture_page_artifacts(page, config, "health-smoke")

                warnings: list[str] = []
                if blocked:
                    warnings.append("Turo appears to be blocking this browser session.")
                warnings.extend(body_warnings)
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
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "health-smoke",
                    "Health smoke failed while opening Turo.",
                )
                return create_result(
                    "health:smoke",
                    {
                        **runtime,
                        "implemented": True,
                        "reachable": False,
                        "error": str(exc),
                        "artifacts": error_artifacts,
                    },
                    warnings=error_warnings,
                    ok=False,
                )
    except BrowserDependencyError as exc:
        return create_result(
            "health:smoke",
            {**runtime, "implemented": False, "dependencyReady": False},
            warnings=[str(exc)],
            ok=False,
        )
