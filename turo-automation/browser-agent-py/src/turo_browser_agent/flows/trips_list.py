from __future__ import annotations

from ..config import read_config
from ..page_state import page_looks_login_required
from ..parsers import normalize_trip_item
from ..runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    prepare_runtime,
    read_page_body_text,
)
from ..types import create_result

TRIPS_URL = "https://turo.com/us/en/trips"


JS_EXTRACT = r'''
() => {
  const anchors = Array.from(document.querySelectorAll('a[data-testid="baseTripCard"], a[href*="/reservation/"]'));
  const seen = new Set();
  const items = [];

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href') || anchor.href || '';
    if (!href || seen.has(href)) continue;
    seen.add(href);

    const text = (anchor.innerText || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const paragraphs = Array.from(anchor.querySelectorAll('p'))
      .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const title = paragraphs.find((value) => /\b\d{4}\b/.test(value)) || paragraphs[1] || paragraphs[0] || null;
    const location = paragraphs.find((value) => / – |, [A-Z]{2}\b/.test(value)) || null;
    const guestLine = paragraphs.find((value) => /#\d+/.test(value)) || null;
    const actor = guestLine ? guestLine.replace(/\s*#\d+.*/, '') : null;
    const reservationIdMatch = href.match(/\/reservation\/(\d+)/);
    const badge = Array.from(anchor.querySelectorAll('div, span'))
      .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim())
      .find((value) => /^(Booked|Upcoming|Ended|Completed|Canceled|Cancelled|In progress)/i.test(value)) || null;

    items.push({
      href,
      text,
      title,
      location,
      actor,
      guestLine,
      reservationId: reservationIdMatch ? reservationIdMatch[1] : null,
      badge,
    });
  }

  return items;
}
'''
def run_trips_list(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        with open_browser_page(config) as (_, _, page):
            try:
                response = page.goto(TRIPS_URL, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass

                title = page.title()
                url = page.url
                body_text, body_warnings = read_page_body_text(page, limit=4000)

                if page_looks_login_required(title, url, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "trips-list-login-required")
                    return create_result(
                        "trips:list",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "login_required",
                            "title": title,
                            "finalUrl": url,
                            "httpStatus": response.status if response else None,
                            "trips": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Trips page requires a logged-in host browser session.", *artifact_warnings],
                    )

                raw_items = page.evaluate(JS_EXTRACT)
                trips = [normalize_trip_item(item) for item in raw_items]
                artifacts, artifact_warnings = capture_page_artifacts(page, config, "trips-list")

                warnings: list[str] = []
                if not trips:
                    warnings.append("Trips page loaded but no trip cards were extracted with the current parser.")
                warnings.extend(body_warnings)
                warnings.extend(artifact_warnings)

                return create_result(
                    "trips:list",
                    {
                        **runtime,
                        "implemented": True,
                        "status": "ok",
                        "title": title,
                        "finalUrl": url,
                        "httpStatus": response.status if response else None,
                        "tripCount": len(trips),
                        "trips": trips,
                        "artifacts": artifacts,
                    },
                    warnings=warnings,
                )
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "trips-list",
                    "Trips list flow failed.",
                )
                return create_result(
                    "trips:list",
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
            "trips:list",
            {**runtime, "implemented": False},
            warnings=[str(exc)],
            ok=False,
        )
