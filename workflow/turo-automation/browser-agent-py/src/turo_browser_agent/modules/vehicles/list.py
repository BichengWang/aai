from __future__ import annotations

from ...config import read_config
from ...js_fragments import build_js_extract
from ...page_state import page_looks_blocked, page_looks_login_required
from ...parsers import normalize_vehicle_item
from ...runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    prepare_runtime,
    read_page_body_text,
)
from ...types import create_result

VEHICLES_URL = "https://turo.com/us/en/vehicles"


JS_EXTRACT = build_js_extract(
    r"""
  const candidates = Array.from(
    inMain.querySelectorAll('a, button, li, article, section, [role="button"], [data-testid]')
  );
  const seen = new Set();
  const items = [];
  const vehicleSignals = /(?:vehicle|vehicles|car|cars|listing|listings|available|unavailable|booked|maintenance|paused|archived|ready)/i;
  const statusRe = /^(Available|Unavailable|Booked|In progress|Completed|Paused|Archived|Maintenance|Ready)$/i;
  const yearRe = /\b(19|20)\d{2}\b/;
  const vehiclePathRe = /\/(?:vehicles?|cars?|listings?)\//i;

  for (const el of candidates) {
    const href = el.getAttribute?.('href') || el.href || '';
    const text = clean(el.innerText);
    if (!text) continue;

    const key = `${href}|${text}`;
    if (seen.has(key)) continue;

    const lines = text.split('\n').map(clean).filter(Boolean);
    const status = lines.find((value) => statusRe.test(value)) || null;
    const title =
      lines.find((value) => value !== status && (yearRe.test(value) || /vehicle|car|listing/i.test(value))) ||
      lines[0] ||
      text.slice(0, 120) ||
      null;
    const location = lines.find((value) => /, [A-Z]{2}\b|airport|delivery|location/i.test(value)) || null;
    const vehicleIdMatch =
      href.match(/\/(?:vehicles?|cars?|listings?)\/([^/?#]+)/i) ||
      text.match(/(?:vehicle|car|listing)\s*#?\s*([A-Za-z0-9-]+)/i);

    if (!vehiclePathRe.test(href) && !vehicleSignals.test(text) && !yearRe.test(text)) {
      continue;
    }

    seen.add(key);
    items.push({
      href,
      text,
      title,
      status,
      location,
      vehicleId: vehicleIdMatch ? vehicleIdMatch[1] : null,
    });

    if (items.length >= 40) {
      break;
    }
  }

  return items;
}
"""
)


def run_vehicles_list(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        storage_state = None if config.use_persistent_profile else str(config.storage_state_path)
        with open_browser_page(config, storage_state=storage_state) as (_, _, page):
            try:
                response = page.goto(VEHICLES_URL, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass

                title = page.title()
                url = page.url
                body_text, body_warnings = read_page_body_text(page, limit=6000)

                if page_looks_blocked(title, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "vehicles-list-blocked")
                    return create_result(
                        "vehicles:list",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "blocked",
                            "title": title,
                            "finalUrl": url,
                            "vehiclesUrl": VEHICLES_URL,
                            "httpStatus": response.status if response else None,
                            "vehicles": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Turo appears to be blocking this browser session.", *artifact_warnings],
                    )

                if page_looks_login_required(title, url, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "vehicles-list-login-required")
                    return create_result(
                        "vehicles:list",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "login_required",
                            "title": title,
                            "finalUrl": url,
                            "vehiclesUrl": VEHICLES_URL,
                            "httpStatus": response.status if response else None,
                            "vehicles": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Vehicles page requires a logged-in host browser session.", *artifact_warnings],
                    )

                raw_items = page.evaluate(JS_EXTRACT)
                vehicles = [normalize_vehicle_item(item) for item in raw_items]
                artifacts, artifact_warnings = capture_page_artifacts(page, config, "vehicles-list")

                warnings: list[str] = []
                if not vehicles:
                    warnings.append("Vehicles page loaded but no vehicle cards were extracted with the current parser.")
                warnings.extend(body_warnings)
                warnings.extend(artifact_warnings)

                return create_result(
                    "vehicles:list",
                    {
                        **runtime,
                        "implemented": True,
                        "status": "ok",
                        "title": title,
                        "finalUrl": url,
                        "vehiclesUrl": VEHICLES_URL,
                        "httpStatus": response.status if response else None,
                        "vehicleCount": len(vehicles),
                        "vehicles": vehicles,
                        "artifacts": artifacts,
                    },
                    warnings=warnings,
                )
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "vehicles-list",
                    "Vehicles list flow failed.",
                )
                return create_result(
                    "vehicles:list",
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
            "vehicles:list",
            {**runtime, "implemented": False},
            warnings=[str(exc)],
            ok=False,
        )
