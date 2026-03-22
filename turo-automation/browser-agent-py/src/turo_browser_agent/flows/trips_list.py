from __future__ import annotations

from ..config import read_config
from ..runtime import BrowserDependencyError, capture_page_artifacts, open_browser_page, prepare_runtime
from ..types import create_result


LOGIN_MARKERS = ["log in", "continue with google", "continue with email"]
TRIPS_URL = "https://turo.com/us/en/trips"


JS_EXTRACT = r'''
() => {
  const anchors = Array.from(document.querySelectorAll('a[href*="/trips/"]'));
  const seen = new Set();
  const items = [];

  for (const anchor of anchors) {
    const href = anchor.href;
    if (!href || seen.has(href)) continue;
    seen.add(href);

    let root = anchor;
    for (let i = 0; i < 4; i += 1) {
      if (!root.parentElement) break;
      root = root.parentElement;
    }

    const text = (root.innerText || anchor.innerText || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    items.push({
      href,
      text,
    });
  }

  return items;
}
'''


def _normalize_trip_item(raw: dict[str, str]) -> dict[str, str | None]:
    text = raw.get("text", "")
    parts = [part.strip() for part in text.split(" · ") if part.strip()]
    title = parts[0] if parts else text[:120] or None
    status = None
    for candidate in ["Booked", "Upcoming", "In progress", "Completed", "Canceled", "Cancelled"]:
      if candidate.lower() in text.lower():
        status = candidate
        break
    return {
        "title": title,
        "status": status,
        "href": raw.get("href"),
        "rawText": text,
    }



def run_trips_list():
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        with open_browser_page(config) as (_, _, page):
            response = page.goto(TRIPS_URL, wait_until="domcontentloaded")
            try:
                page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
            except Exception:
                pass

            title = page.title()
            url = page.url
            body_text = (page.locator("body").inner_text(timeout=5000) or "")[:4000]
            lower = body_text.lower()

            if any(marker in lower for marker in LOGIN_MARKERS) or "/login" in url:
                artifacts = capture_page_artifacts(page, config, "trips-list-login-required")
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
                    warnings=["Trips page requires a logged-in host browser session."],
                )

            raw_items = page.evaluate(JS_EXTRACT)
            trips = [_normalize_trip_item(item) for item in raw_items]
            artifacts = capture_page_artifacts(page, config, "trips-list")

            warnings = None
            if not trips:
                warnings = ["Trips page loaded but no trip cards were extracted with the current parser."]

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
    except BrowserDependencyError as exc:
        return create_result(
            "trips:list",
            {**runtime, "implemented": False},
            warnings=[str(exc)],
            ok=False,
        )
    except Exception as exc:
        return create_result(
            "trips:list",
            {**runtime, "implemented": True, "error": str(exc)},
            warnings=["Trips list flow failed."],
            ok=False,
        )
