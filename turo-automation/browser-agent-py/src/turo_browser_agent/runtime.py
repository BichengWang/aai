from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from .config import BrowserAgentConfig, read_config
from .fs import ensure_dir, ensure_parent_dir


class BrowserDependencyError(RuntimeError):
    pass



def prepare_runtime(config: BrowserAgentConfig | None = None) -> dict[str, object]:
    cfg = config or read_config()
    ensure_parent_dir(cfg.storage_state_path)
    ensure_dir(cfg.artifacts_dir)
    ensure_dir(cfg.user_data_dir)
    return {
        "baseUrl": cfg.base_url,
        "loginUrl": cfg.login_url,
        "headless": cfg.headless,
        "defaultTimeoutMs": cfg.default_timeout_ms,
        "slowMoMs": cfg.slowmo_ms,
        "bootstrapWaitMs": cfg.bootstrap_wait_ms,
        "storageStatePath": str(cfg.storage_state_path),
        "artifactsDir": str(cfg.artifacts_dir),
        "repoRoot": str(cfg.repo_root),
        "browserChannel": cfg.browser_channel,
        "usePersistentProfile": cfg.use_persistent_profile,
        "userDataDir": str(cfg.user_data_dir),
        "useCdpAttach": cfg.use_cdp_attach,
        "cdpUrl": cfg.cdp_url,
    }



def require_playwright():
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except ImportError as exc:
        raise BrowserDependencyError(
            "Playwright for Python is not installed. Run `python3 -m pip install -e .` in browser-agent-py first."
        ) from exc
    return sync_playwright



def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")



def artifact_path(config: BrowserAgentConfig, prefix: str, suffix: str = ".png") -> Path:
    ensure_dir(config.artifacts_dir)
    return config.artifacts_dir / f"{prefix}-{utc_stamp()}{suffix}"



def capture_page_artifacts(page, config: BrowserAgentConfig, prefix: str) -> tuple[list[str], list[str]]:
    artifacts: list[str] = []
    warnings: list[str] = []

    screenshot = artifact_path(config, prefix, ".png")
    try:
        page.screenshot(path=str(screenshot), full_page=True)
        artifacts.append(str(screenshot))
    except Exception as exc:
        warnings.append(f"Screenshot capture failed: {exc}")

    html = artifact_path(config, prefix, ".html")
    try:
        html.write_text(page.content(), encoding="utf-8")
        artifacts.append(str(html))
    except Exception as exc:
        warnings.append(f"HTML capture failed: {exc}")

    return artifacts, warnings


def read_page_body_text(page, *, limit: int, timeout_ms: int = 5000) -> tuple[str, list[str]]:
    warnings: list[str] = []
    text = ""

    try:
        text = page.evaluate("() => document.body ? document.body.innerText : ''") or ""
    except Exception as exc:
        warnings.append(f"Body text capture via evaluation failed: {exc}")

    if not text:
        try:
            text = page.locator("body").inner_text(timeout=timeout_ms) or ""
        except Exception as exc:
            warnings.append(f"Body text capture via locator failed: {exc}")
            text = ""

    return text[:limit], warnings



def browser_launch_kwargs(config: BrowserAgentConfig) -> dict[str, object]:
    kwargs: dict[str, object] = {
        "headless": config.headless,
        "slow_mo": config.slowmo_ms,
    }
    if config.browser_channel:
        kwargs["channel"] = config.browser_channel
    return kwargs


@contextmanager
def open_browser_page(config: BrowserAgentConfig | None = None, *, storage_state: str | None = None) -> Iterator[tuple[object, object, object]]:
    cfg = config or read_config()
    sync_playwright = require_playwright()
    with sync_playwright() as playwright:
        if cfg.use_cdp_attach:
            if not cfg.cdp_url:
                raise BrowserDependencyError(
                    "CDP attach mode requires BROWSER_AGENT_CDP_URL, for example http://127.0.0.1:9222"
                )
            browser = playwright.chromium.connect_over_cdp(cfg.cdp_url)
            contexts = browser.contexts
            context = contexts[0] if contexts else browser.new_context()
            pages = context.pages
            page = pages[0] if pages else context.new_page()
            page.set_default_timeout(cfg.default_timeout_ms)
            try:
                yield browser, context, page
            finally:
                browser.close()
            return

        if cfg.use_persistent_profile:
            context = playwright.chromium.launch_persistent_context(
                user_data_dir=str(cfg.user_data_dir),
                **browser_launch_kwargs(cfg),
            )
            pages = context.pages
            page = pages[0] if pages else context.new_page()
            page.set_default_timeout(cfg.default_timeout_ms)
            browser = context.browser
            try:
                yield browser, context, page
            finally:
                context.close()
            return

        browser = playwright.chromium.launch(**browser_launch_kwargs(cfg))
        context_kwargs: dict[str, object] = {}
        if storage_state is not None:
            context_kwargs["storage_state"] = storage_state
        context = browser.new_context(**context_kwargs)
        page = context.new_page()
        page.set_default_timeout(cfg.default_timeout_ms)
        try:
            yield browser, context, page
        finally:
            context.close()
            browser.close()
