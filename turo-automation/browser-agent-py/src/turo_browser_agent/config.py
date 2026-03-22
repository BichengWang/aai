from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(slots=True)
class BrowserAgentConfig:
    base_url: str
    login_url: str
    headless: bool
    default_timeout_ms: int
    slowmo_ms: int
    bootstrap_wait_ms: int
    storage_state_path: Path
    artifacts_dir: Path
    repo_root: Path
    browser_channel: str | None
    use_persistent_profile: bool
    user_data_dir: Path
    use_cdp_attach: bool
    cdp_url: str | None



def _default_repo_root() -> Path:
    return Path(__file__).resolve().parents[2]



def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.lower() in {"1", "true", "yes", "on"}



def read_config() -> BrowserAgentConfig:
    repo_root = Path(os.getenv("TURO_BROWSER_AGENT_ROOT", _default_repo_root()))
    storage_state_path = Path(
        os.getenv(
            "BROWSER_AGENT_STORAGE_STATE_PATH",
            str(repo_root / "storage" / "state.json"),
        )
    )
    artifacts_dir = Path(
        os.getenv(
            "BROWSER_AGENT_ARTIFACTS_DIR",
            str(repo_root / "artifacts"),
        )
    )
    base_url = os.getenv("TURO_BASE_URL", "https://turo.com")
    login_url = os.getenv("TURO_LOGIN_URL", f"{base_url.rstrip('/')}/login")
    browser_channel = os.getenv("BROWSER_AGENT_BROWSER_CHANNEL") or None
    user_data_dir = Path(
        os.getenv(
            "BROWSER_AGENT_USER_DATA_DIR",
            str(repo_root / "browser-profile"),
        )
    )
    cdp_url = os.getenv("BROWSER_AGENT_CDP_URL") or None

    return BrowserAgentConfig(
        base_url=base_url,
        login_url=login_url,
        headless=_env_bool("BROWSER_AGENT_HEADLESS", False),
        default_timeout_ms=int(os.getenv("BROWSER_AGENT_TIMEOUT_MS", "15000")),
        slowmo_ms=int(os.getenv("BROWSER_AGENT_SLOWMO_MS", "0")),
        bootstrap_wait_ms=int(os.getenv("BROWSER_AGENT_BOOTSTRAP_WAIT_MS", "120000")),
        storage_state_path=storage_state_path,
        artifacts_dir=artifacts_dir,
        repo_root=repo_root,
        browser_channel=browser_channel,
        use_persistent_profile=_env_bool("BROWSER_AGENT_USE_PERSISTENT_PROFILE", False),
        user_data_dir=user_data_dir,
        use_cdp_attach=_env_bool("BROWSER_AGENT_USE_CDP_ATTACH", False),
        cdp_url=cdp_url,
    )
