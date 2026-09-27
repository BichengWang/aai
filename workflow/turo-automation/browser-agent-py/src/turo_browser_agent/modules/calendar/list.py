from __future__ import annotations

from ...config import read_config
from ...js_fragments import build_js_extract
from ...page_state import page_looks_blocked, page_looks_login_required
from ...parsers import normalize_calendar_entry
from ...runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    prepare_runtime,
    read_page_body_text,
)
from ...types import create_result

CALENDAR_URL = "https://turo.com/us/en/calendar"


JS_EXTRACT = build_js_extract(
    r"""
  const candidates = Array.from(
    inMain.querySelectorAll('a, button, li, article, section, [role="button"], [data-testid]')
  );
  const seen = new Set();
  const items = [];
  const statusRe = /^(Available|Unavailable|Booked|Upcoming|In progress|Completed|Canceled|Cancelled|Ended|Past trip)$/i;
  const dateRe = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\b\d{1,2}:\d{2}\s+[AP]M\b)/i;

  for (const el of candidates) {
    const href = el.getAttribute?.('href') || el.href || '';
    const text = clean(el.innerText);
    if (!text) continue;

    const key = `${href}|${text}`;
    if (seen.has(key)) continue;

    const lines = text.split('\n').map(clean).filter(Boolean);
    const dateLine = lines.find((value) => dateRe.test(value)) || null;
    const status = lines.find((value) => statusRe.test(value)) || null;
    const reservationIdMatch = href.match(/\/reservation\/(\d+)/) || text.match(/(?:reservation\s*#?\s*|#)(\d{6,})/i);
    const title = lines.find((value) => value !== status && value !== dateLine) || lines[0] || text.slice(0, 120) || null;

    if (!dateLine && !reservationIdMatch && !status && !/calendar|trip|reservation|available|unavailable/i.test(text)) {
      continue;
    }

    seen.add(key);
    items.push({
      href,
      text,
      title,
      dateLine,
      status,
      reservationId: reservationIdMatch ? reservationIdMatch[1] : null,
    });

    if (items.length >= 40) {
      break;
    }
  }

  return items;
}
"""
)


def run_calendar_list(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        storage_state = None if config.use_persistent_profile else str(config.storage_state_path)
        with open_browser_page(config, storage_state=storage_state) as (_, _, page):
            try:
                response = page.goto(CALENDAR_URL, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass

                title = page.title()
                url = page.url
                body_text, body_warnings = read_page_body_text(page, limit=6000)

                if page_looks_blocked(title, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "calendar-list-blocked")
                    return create_result(
                        "calendar:list",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "blocked",
                            "title": title,
                            "finalUrl": url,
                            "calendarUrl": CALENDAR_URL,
                            "httpStatus": response.status if response else None,
                            "entries": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Turo appears to be blocking this browser session.", *artifact_warnings],
                    )

                if page_looks_login_required(title, url, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "calendar-list-login-required")
                    return create_result(
                        "calendar:list",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "login_required",
                            "title": title,
                            "finalUrl": url,
                            "calendarUrl": CALENDAR_URL,
                            "httpStatus": response.status if response else None,
                            "entries": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Calendar page requires a logged-in host browser session.", *artifact_warnings],
                    )

                raw_entries = page.evaluate(JS_EXTRACT)
                entries = [normalize_calendar_entry(item) for item in raw_entries]
                artifacts, artifact_warnings = capture_page_artifacts(page, config, "calendar-list")

                warnings: list[str] = []
                if not entries:
                    warnings.append("Calendar page loaded but no calendar entries were extracted with the current parser.")
                warnings.extend(body_warnings)
                warnings.extend(artifact_warnings)

                return create_result(
                    "calendar:list",
                    {
                        **runtime,
                        "implemented": True,
                        "status": "ok",
                        "title": title,
                        "finalUrl": url,
                        "calendarUrl": CALENDAR_URL,
                        "httpStatus": response.status if response else None,
                        "entryCount": len(entries),
                        "entries": entries,
                        "artifacts": artifacts,
                    },
                    warnings=warnings,
                )
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "calendar-list",
                    "Calendar list flow failed.",
                )
                return create_result(
                    "calendar:list",
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
            "calendar:list",
            {**runtime, "implemented": False},
            warnings=[str(exc)],
            ok=False,
        )
