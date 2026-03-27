from __future__ import annotations

from ...config import read_config
from ...js_fragments import build_js_extract
from ...page_state import page_looks_blocked, page_looks_login_required
from ...parsers import normalize_message_thread
from ...runtime import (
    BrowserDependencyError,
    capture_page_artifacts,
    capture_page_failure_artifacts,
    open_browser_page,
    prepare_runtime,
    read_page_body_text,
)
from ...types import create_result

MESSAGES_URL = "https://turo.com/us/en/messages"


JS_EXTRACT = build_js_extract(
    r"""
  const anchors = Array.from(inMain.querySelectorAll('a[href*="/messages"], a[href*="/reservation/"]'));
  const seen = new Set();
  const items = [];

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href') || anchor.href || '';
    if (!href || seen.has(href)) continue;
    seen.add(href);

    const text = clean(anchor.innerText);
    if (!text) continue;

    const parts = Array.from(anchor.querySelectorAll('h1, h2, h3, h4, p, span, li, div, time'))
      .map((el) => clean(el.innerText))
      .filter(Boolean);

    const title = parts.find((value) => /\b\d{4}\b/.test(value)) || parts[0] || text.slice(0, 120) || null;
    const guest = parts.find((value) => /^guest:/i.test(value))
      || parts.find((value) => /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(value))
      || null;
    const reservationIdMatch = href.match(/\/reservation\/(\d+)/);
    const lastMessageAt = Array.from(anchor.querySelectorAll('time'))
      .map((el) => clean(el.getAttribute('datetime') || el.innerText))
      .find(Boolean) || null;
    const unread = /\bunread\b/i.test(text) || parts.some((value) => /\bunread\b/i.test(value));
    const status = parts.find((value) => /^(Unread|Needs reply|Replied|Read|Archived|Open|Closed)$/i.test(value)) || null;

    items.push({
      href,
      text,
      title,
      guest,
      reservationId: reservationIdMatch ? reservationIdMatch[1] : null,
      lastMessageAt,
      unread,
      status,
    });
  }

  return items;
}
"""
)


def run_messages_list(args: list[str] | None = None):
    config = read_config()
    runtime = prepare_runtime(config)

    try:
        storage_state = None if config.use_persistent_profile else str(config.storage_state_path)
        with open_browser_page(config, storage_state=storage_state) as (_, _, page):
            try:
                response = page.goto(MESSAGES_URL, wait_until="domcontentloaded")
                try:
                    page.wait_for_load_state("networkidle", timeout=min(config.default_timeout_ms, 5000))
                except Exception:
                    pass

                title = page.title()
                url = page.url
                body_text, body_warnings = read_page_body_text(page, limit=6000)

                if page_looks_blocked(title, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "messages-list-blocked")
                    return create_result(
                        "messages:list",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "blocked",
                            "title": title,
                            "finalUrl": url,
                            "messagesUrl": MESSAGES_URL,
                            "httpStatus": response.status if response else None,
                            "threads": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Turo appears to be blocking this browser session.", *artifact_warnings],
                    )

                if page_looks_login_required(title, url, body_text):
                    artifacts, artifact_warnings = capture_page_artifacts(page, config, "messages-list-login-required")
                    return create_result(
                        "messages:list",
                        {
                            **runtime,
                            "implemented": True,
                            "status": "login_required",
                            "title": title,
                            "finalUrl": url,
                            "messagesUrl": MESSAGES_URL,
                            "httpStatus": response.status if response else None,
                            "threads": [],
                            "artifacts": artifacts,
                        },
                        warnings=["Messages page requires a logged-in host browser session.", *artifact_warnings],
                    )

                raw_threads = page.evaluate(JS_EXTRACT)
                threads = [normalize_message_thread(item) for item in raw_threads]
                artifacts, artifact_warnings = capture_page_artifacts(page, config, "messages-list")

                warnings: list[str] = []
                if not threads:
                    warnings.append("Messages page loaded but no thread cards were extracted with the current parser.")
                warnings.extend(body_warnings)
                warnings.extend(artifact_warnings)

                return create_result(
                    "messages:list",
                    {
                        **runtime,
                        "implemented": True,
                        "status": "ok",
                        "title": title,
                        "finalUrl": url,
                        "messagesUrl": MESSAGES_URL,
                        "httpStatus": response.status if response else None,
                        "threadCount": len(threads),
                        "threads": threads,
                        "artifacts": artifacts,
                    },
                    warnings=warnings,
                )
            except Exception as exc:
                error_artifacts, error_warnings = capture_page_failure_artifacts(
                    page,
                    config,
                    "messages-list",
                    "Messages list flow failed.",
                )
                return create_result(
                    "messages:list",
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
            "messages:list",
            {**runtime, "implemented": False},
            warnings=[str(exc)],
            ok=False,
        )
