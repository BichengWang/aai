from __future__ import annotations

from ..config import read_config
from ..js_fragments import build_js_extract
from ..page_state import page_looks_login_required
from ..parsers import normalize_trip_detail, resolve_trip_target
from ..runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    prepare_runtime,
    read_page_body_text,
)
from ..types import create_result

JS_EXTRACT = build_js_extract(
    r"""
  const headings = Array.from(inMain.querySelectorAll('h1, h2, h3'))
    .map((el) => clean(el.innerText))
    .filter(Boolean);
  const badges = Array.from(inMain.querySelectorAll('span, div, p'))
    .map((el) => clean(el.innerText))
    .filter((value) => /^(Booked|Upcoming|Ended|Completed|Canceled|Cancelled|In progress)$/i.test(value));
  const keyLines = Array.from(inMain.querySelectorAll('p, li, dt, dd, span'))
    .map((el) => clean(el.innerText))
    .filter(Boolean)
    .filter((value) => /reservation|guest|pickup|return|delivery|vehicle|trip|airport|booked|upcoming|completed|cancelled|canceled|ended|in progress|earnings/i.test(value))
    .slice(0, 80);

  return { headings, badges, keyLines };
}
"""
)


def run_trip_get(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)
    argv = args or []

    if not argv:
        return create_result(
            "trip:get",
            {**runtime, "implemented": True, "status": "missing_target"},
            warnings=["Missing trip target. Usage: ./run trip-get <reservation-id-or-url>"],
            ok=False,
        )

    try:
        target_url, requested_reservation_id = resolve_trip_target(argv[0], config.base_url)
    except ValueError as exc:
        return create_result(
            "trip:get",
            {**runtime, "implemented": True, "status": "invalid_target", "target": argv[0]},
            warnings=[str(exc)],
            ok=False,
        )

    try:
        storage_state = None if config.use_persistent_profile else str(config.storage_state_path)
        with open_browser_page(config, storage_state=storage_state) as (_, _, page):
            try:
                response = page.goto(target_url, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass

                title = page.title()
                url = page.url
                body_text, body_warnings = read_page_body_text(page, limit=8000)

                if page_looks_login_required(title, url, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "trip-get-login-required")
                    return create_result(
                        "trip:get",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "login_required",
                            "target": argv[0],
                            "requestedUrl": target_url,
                            "requestedReservationId": requested_reservation_id,
                            "title": title,
                            "finalUrl": url,
                            "httpStatus": response.status if response else None,
                            "artifacts": artifacts,
                        },
                        warnings=["Trip detail page requires a logged-in host browser session.", *artifact_warnings],
                    )

                raw_detail = page.evaluate(JS_EXTRACT)
                trip = normalize_trip_detail(raw_detail, url, body_text)
                artifacts, artifact_warnings = capture_page_artifacts(page, config, "trip-get")

                warnings: list[str] = []
                if not trip["headline"] and not trip["keyLines"]:
                    warnings.append("Trip detail page loaded but no structured detail fields were extracted with the current parser.")
                warnings.extend(body_warnings)
                warnings.extend(artifact_warnings)

                return create_result(
                    "trip:get",
                    {
                        **runtime,
                        "implemented": True,
                        "status": "ok",
                        "target": argv[0],
                        "requestedUrl": target_url,
                        "requestedReservationId": requested_reservation_id,
                        "title": title,
                        "finalUrl": url,
                        "httpStatus": response.status if response else None,
                        "trip": trip,
                        "artifacts": artifacts,
                    },
                    warnings=warnings,
                )
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "trip-get",
                    "Trip detail flow failed.",
                )
                return create_result(
                    "trip:get",
                    {
                        **runtime,
                        "implemented": True,
                        "target": argv[0],
                        "requestedUrl": target_url,
                        "requestedReservationId": requested_reservation_id,
                        "error": str(exc),
                        "artifacts": error_artifacts,
                    },
                    warnings=error_warnings,
                    ok=False,
                )
    except BrowserDependencyError as exc:
        return create_result(
            "trip:get",
            {**runtime, "implemented": False, "target": argv[0]},
            warnings=[str(exc)],
            ok=False,
        )
