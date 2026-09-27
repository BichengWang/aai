from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass(slots=True)
class BrowserAgentResult:
    ok: bool
    workflow: str
    timestamp: str
    data: dict[str, Any]
    warnings: list[str] | None = None

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        if self.warnings is None:
            payload.pop("warnings", None)
        return payload



def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()



def create_result(workflow: str, data: dict[str, Any], warnings: list[str] | None = None, *, ok: bool = True) -> BrowserAgentResult:
    return BrowserAgentResult(
        ok=ok,
        workflow=workflow,
        timestamp=utc_timestamp(),
        data=data,
        warnings=warnings,
    )
