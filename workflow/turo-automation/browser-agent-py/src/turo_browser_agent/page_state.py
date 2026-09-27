from __future__ import annotations

LOGIN_REQUIRED_MARKERS = (
    "log in",
    "sign up",
    "join turo",
    "continue with google",
    "continue with email",
)
BLOCKED_MARKERS = ("you've been blocked",)


def _contains_any(*values: str | None, markers: tuple[str, ...]) -> bool:
    haystack = " ".join(value for value in values if value).lower().replace("’", "'")
    if "/login" in haystack:
        return True
    return any(marker in haystack for marker in markers)


def page_looks_login_required(*values: str | None) -> bool:
    return _contains_any(*values, markers=LOGIN_REQUIRED_MARKERS)


def page_looks_blocked(*values: str | None) -> bool:
    return _contains_any(*values, markers=BLOCKED_MARKERS)
