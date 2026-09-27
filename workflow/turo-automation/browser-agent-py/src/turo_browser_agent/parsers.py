from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from typing import Any
from urllib.parse import urlparse


TRIP_STATUS_CANDIDATES = [
    "Past trip",
    "Booked",
    "Upcoming",
    "In progress",
    "Completed",
    "Canceled",
    "Cancelled",
    "Ended",
]
VEHICLE_STATUS_CANDIDATES = [
    "Available",
    "Unavailable",
    "Booked",
    "In progress",
    "Completed",
    "Paused",
    "Archived",
    "Maintenance",
    "Ready",
]
PROFILE_SIGNAL_DISPLAY = {
    "account": "Account",
    "vehicles": "Vehicles",
    "trips": "Trips",
    "inbox": "Inbox",
    "settings": "Settings",
    "switch to guest": "Switch to guest",
    "sign out": "Sign out",
    "log out": "Log out",
}
CALENDAR_STATUS_CANDIDATES = [
    "Available",
    "Unavailable",
    "Booked",
    "Upcoming",
    "In progress",
    "Completed",
    "Canceled",
    "Cancelled",
    "Ended",
]
RESERVATION_PATH_RE = re.compile(r"/reservation/(\d+)")
RESERVATION_TEXT_RE = re.compile(r"(?:reservation\s*#?\s*|#)(\d{6,})", re.IGNORECASE)
VEHICLE_PATH_RE = re.compile(r"/(?:vehicles?|cars?|listings?)/([^/?#]+)", re.IGNORECASE)
VEHICLE_TEXT_RE = re.compile(r"(?:vehicle|car|listing)\s*#?\s*([A-Za-z0-9-]+)", re.IGNORECASE)
DATE_TIME_LINE_RE = re.compile(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+[A-Z][a-z]{2}\s+\d{1,2}(?:\s+at)?\s+\d{1,2}:\d{2}\s+[AP]M$", re.IGNORECASE)
TRIP_HEADING_RE = re.compile(r"^(.+?)[\u2019']S TRIP$", re.IGNORECASE)
INLINE_DATE_TIME_RE = re.compile(r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+[A-Z][a-z]{2}\s+\d{1,2}(?:\s+at)?\s+\d{1,2}:\d{2}\s+[AP]M", re.IGNORECASE)


def _dedupe_texts(values: Iterable[str | None]) -> list[str]:
    items: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = " ".join((value or "").split()).strip()
        if not cleaned:
            continue
        lowered = cleaned.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        items.append(cleaned)
    return items


def _build_summary(parts: Iterable[str | None]) -> str | None:
    items = _dedupe_texts(parts)
    return " · ".join(items) if items else None


def extract_trip_status(*values: str | None) -> str | None:
    haystack = " ".join(value for value in values if value).lower()
    for candidate in TRIP_STATUS_CANDIDATES:
        if candidate.lower() in haystack:
            return candidate
    return None


def extract_vehicle_status(*values: str | None) -> str | None:
    haystack = " ".join(value for value in values if value).lower()
    for candidate in VEHICLE_STATUS_CANDIDATES:
        if candidate.lower() in haystack:
            return candidate
    return None


def extract_calendar_status(*values: str | None) -> str | None:
    haystack = " ".join(value for value in values if value).lower()
    for candidate in CALENDAR_STATUS_CANDIDATES:
        if candidate.lower() in haystack:
            return candidate
    return None


def extract_reservation_id(*values: str | None) -> str | None:
    for value in values:
        if not value:
            continue
        path_match = RESERVATION_PATH_RE.search(value)
        if path_match:
            return path_match.group(1)
        text_match = RESERVATION_TEXT_RE.search(value)
        if text_match:
            return text_match.group(1)
    return None


def extract_vehicle_id(*values: str | None) -> str | None:
    for value in values:
        if not value:
            continue
        path_match = VEHICLE_PATH_RE.search(value)
        if path_match:
            return path_match.group(1)
        text_match = VEHICLE_TEXT_RE.search(value)
        if text_match:
            return text_match.group(1)
    return None


def _looks_like_location(value: str) -> bool:
    lower = value.lower()
    return (
        (", " in value or "airport" in lower or "delivery" in lower)
        and "pickup" not in lower
        and "return" not in lower
        and not re.search(r"\d{1,2}:\d{2}\s+[AP]M", value)
    )


def _clean_guest_name(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"^guest:\s*", "", value, flags=re.IGNORECASE).strip()
    return cleaned or None


def _clean_trip_time(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"^(pickup|return|delivery)\s*:\s*", "", value, flags=re.IGNORECASE).strip()
    return cleaned or None


def _clean_location(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"^(?:(pickup|return|delivery)\s+)?location\s*:\s*", "", value, flags=re.IGNORECASE).strip()
    return cleaned or None


def _clean_message_participant(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"^(?:guest|thread|conversation|message)\s*:\s*", "", value, flags=re.IGNORECASE).strip()
    return cleaned or None


def _looks_like_person_name(value: str | None) -> bool:
    if value is None:
        return False
    cleaned = " ".join(value.split()).strip()
    return bool(
        cleaned
        and not re.search(r"\d", cleaned)
        and re.fullmatch(r"[A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*){1,2}", cleaned)
    )


def _extract_leading_person_name(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.split()).strip()
    if not cleaned:
        return None

    candidates = [cleaned]
    for separator in (" | ", " - ", " — ", " • "):
        if separator in cleaned:
            candidates.append(cleaned.split(separator, 1)[0].strip())

    for candidate in candidates:
        if _looks_like_person_name(candidate):
            return candidate
    return None


def normalize_trip_item(raw: Mapping[str, str | None]) -> dict[str, str | None]:
    text = raw.get("text", "") or ""
    title = raw.get("title") or text[:120] or None
    status = extract_trip_status(text, raw.get("badge"))
    location = raw.get("location")
    guest = raw.get("actor")
    reservation_id = raw.get("reservationId") or extract_reservation_id(raw.get("href"), text)
    if guest is None:
        guest = _extract_leading_person_name(title)
    summary = _build_summary([status, title, guest, location, f"Reservation #{reservation_id}" if reservation_id else None])
    return {
        "title": title,
        "status": status,
        "href": raw.get("href"),
        "location": location,
        "guest": guest,
        "reservationId": reservation_id,
        "summary": summary,
        "rawText": text,
    }


def normalize_vehicle_item(raw: Mapping[str, str | None]) -> dict[str, str | None]:
    text = raw.get("text", "") or ""
    title = raw.get("title") or text[:120] or None
    status = extract_vehicle_status(text, raw.get("status"), raw.get("badge"))
    location = raw.get("location")
    vehicle_id = raw.get("vehicleId") or extract_vehicle_id(raw.get("href"), text)
    summary = _build_summary([status, title, location, f"Vehicle #{vehicle_id}" if vehicle_id else None])
    return {
        "title": title,
        "status": status,
        "href": raw.get("href"),
        "location": location,
        "vehicleId": vehicle_id,
        "summary": summary,
        "rawText": text,
    }


def normalize_profile_snapshot(raw: Mapping[str, Any], final_url: str, body_text: str) -> dict[str, Any]:
    headings = _dedupe_texts(raw.get("headings", []))
    link_texts = _dedupe_texts(raw.get("linkTexts", []))
    body_lines = _dedupe_texts(body_text.splitlines())
    collapsed_text = " ".join(body_text.split()).strip()

    body_haystack = " ".join(body_lines).lower()
    body_signals = [
        PROFILE_SIGNAL_DISPLAY[keyword]
        for keyword in [
            "account",
            "vehicles",
            "trips",
            "inbox",
            "settings",
            "switch to guest",
            "sign out",
            "log out",
        ]
        if keyword in body_haystack
    ]
    signals = _dedupe_texts([*headings, *link_texts, *body_signals])
    headline = headings[0] if headings else (signals[0] if signals else None)
    summary = _build_summary([headline, signals[0] if signals else None, "Profile check"])

    return {
        "headline": headline,
        "signals": signals,
        "href": final_url,
        "summary": summary,
        "rawText": collapsed_text,
    }


def resolve_trip_target(target: str, base_url: str) -> tuple[str, str | None]:
    cleaned = target.strip()
    if not cleaned:
        raise ValueError("Missing trip target. Usage: trip-get <reservation-id-or-url>")

    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        url = cleaned
    elif cleaned.startswith("/"):
        url = f"{base_url.rstrip('/')}{cleaned}"
    elif cleaned.isdigit():
        url = f"{base_url.rstrip('/')}/us/en/reservation/{cleaned}"
    else:
        raise ValueError("Trip target must be a reservation ID, a /us/en/reservation/... path, or a full URL.")

    return url, extract_reservation_id(cleaned, urlparse(url).path, url)


def normalize_trip_detail(raw: Mapping[str, Any], final_url: str, body_text: str) -> dict[str, Any]:
    headings = _dedupe_texts(raw.get("headings", []))
    badges = _dedupe_texts(raw.get("badges", []))
    key_lines = _dedupe_texts(raw.get("keyLines", []))
    body_lines = _dedupe_texts(body_text.splitlines())
    collapsed_text = " ".join(body_text.split()).strip()

    vehicle_summary_match = re.search(r"\bvehicle\s+(.+?)\s+View car details\b", collapsed_text, re.IGNORECASE)
    location_summary_match = re.search(r"\b(?:DELIVERY|PICKUP)\s+(.+?)\s+Get directions\b", collapsed_text, re.IGNORECASE)
    inline_dates = [match.group(0) for match in INLINE_DATE_TIME_RE.finditer(collapsed_text)]

    vehicle_candidates = [
        value
        for value in [*body_lines, *key_lines, *headings]
        if re.search(r"\b\d{4}\b", value)
        and len(value) <= 80
        and ":" not in value
        and "trip" not in value.lower()
        and "reservation" not in value.lower()
    ]
    vehicle = vehicle_summary_match.group(1).strip() if vehicle_summary_match else None
    if vehicle is None:
        vehicle = min(vehicle_candidates, key=len) if vehicle_candidates else None

    headline = vehicle
    if headline is None:
        headline = next((value for value in headings if re.search(r"\b\d{4}\b", value)), None)
    if headline is None:
        headline = headings[0] if headings else (key_lines[0] if key_lines else None)

    trip_heading = next((value for value in headings if TRIP_HEADING_RE.match(value)), None)
    guest = None
    if trip_heading:
        heading_match = TRIP_HEADING_RE.match(trip_heading)
        if heading_match:
            guest = _clean_guest_name(heading_match.group(1).title())
    if guest is None:
        guest = _clean_guest_name(
            next(
                (
                    value
                    for value in [*body_lines, *key_lines]
                    if value.lower().startswith("guest:") and "switch to guest" not in value.lower()
                ),
                None,
            )
        )

    date_lines = [value for value in body_lines if DATE_TIME_LINE_RE.match(value)]
    pickup = date_lines[0] if date_lines else None
    trip_return = date_lines[1] if len(date_lines) > 1 else None
    if pickup is None and inline_dates:
        pickup = inline_dates[0]
    if trip_return is None and len(inline_dates) > 1:
        trip_return = inline_dates[1]
    if pickup is None:
        pickup = _clean_trip_time(
            next(
                (
                    value
                    for value in [*body_lines, *key_lines]
                    if value.lower().startswith("pickup:") and len(value) <= 120
                ),
                None,
            )
        )
    if trip_return is None:
        trip_return = _clean_trip_time(
            next(
                (
                    value
                    for value in [*body_lines, *key_lines]
                    if value.lower().startswith("return:") and len(value) <= 120
                ),
                None,
            )
        )
    location = location_summary_match.group(1).strip() if location_summary_match else None
    for index, value in enumerate(body_lines):
        if value.strip().upper() != "LOCATION":
            continue
        for candidate in body_lines[index + 1 :]:
            if not candidate or candidate.strip().upper() == "GET DIRECTIONS":
                continue
            if _looks_like_location(candidate):
                location = candidate
                break
        if location:
            break

    if location is None:
        location = _clean_location(
            next(
                (
                    value
                    for value in [*body_lines, *key_lines]
                    if re.match(r"^(?:(pickup|return|delivery)\s+)?location\s*:", value, re.IGNORECASE)
                ),
                None,
            )
        )

    location = next(
        (
            candidate
            for candidate in [_clean_location(value) for value in ([location] if location else []) + [*body_lines, *key_lines]]
            if candidate and _looks_like_location(candidate)
        ),
        None,
    )

    snippet = " ".join(body_text.split()).strip()[:1000] or None
    summary = _build_summary(
        [
            extract_trip_status(" ".join(headings), " ".join(badges), " ".join(key_lines), body_text),
            headline,
            guest,
            pickup if pickup and trip_return is None else None,
            trip_return if pickup is None and trip_return else None,
            f"{pickup} → {trip_return}" if pickup and trip_return else None,
            location,
        ]
    )

    return {
        "headline": headline,
        "vehicle": vehicle or headline,
        "status": extract_trip_status(" ".join(headings), " ".join(badges), " ".join(key_lines), body_text),
        "reservationId": extract_reservation_id(final_url, *headings, *key_lines, body_text),
        "guest": guest,
        "pickup": pickup,
        "return": trip_return,
        "location": location,
        "summary": summary,
        "headings": headings[:10],
        "badges": badges[:10],
        "keyLines": key_lines[:20],
        "rawTextSnippet": snippet,
    }


def normalize_message_thread(raw: Mapping[str, Any]) -> dict[str, Any]:
    text = raw.get("text", "") or ""
    title = raw.get("title") or text[:120] or None
    guest = raw.get("guest") or _clean_message_participant(raw.get("actor"))
    status = raw.get("status") or None
    reservation_id = raw.get("reservationId") or extract_reservation_id(raw.get("href"), text)

    if guest is None and text.lower().startswith("guest:"):
        guest = _clean_message_participant(text)
    if guest is None and _looks_like_person_name(title):
        guest = _clean_message_participant(title)
    if guest is None:
        guest = _extract_leading_person_name(title)

    summary = _build_summary(
        [
            guest,
            status if status else ("Unread" if raw.get("unread", False) else None),
            f"Reservation #{reservation_id}" if reservation_id else None,
        ]
    )

    return {
        "title": title,
        "guest": guest,
        "status": status,
        "summary": summary,
        "unread": bool(raw.get("unread", False)),
        "href": raw.get("href"),
        "reservationId": reservation_id,
        "lastMessageAt": raw.get("lastMessageAt"),
        "rawText": text,
    }


def normalize_calendar_entry(raw: Mapping[str, Any]) -> dict[str, Any]:
    text = raw.get("text", "") or ""
    title = raw.get("title") or raw.get("label") or text[:120] or None
    date_line = raw.get("dateLine") or raw.get("date") or None
    status = raw.get("status") or extract_calendar_status(text, title, date_line)
    reservation_id = raw.get("reservationId") or extract_reservation_id(raw.get("href"), text)
    location = raw.get("location") or None
    summary = _build_summary(
        [
            status,
            title,
            date_line,
            location,
            f"Reservation #{reservation_id}" if reservation_id else None,
        ]
    )

    return {
        "title": title,
        "label": raw.get("label") or title,
        "status": status,
        "dateLine": date_line,
        "location": location,
        "summary": summary,
        "href": raw.get("href"),
        "reservationId": reservation_id,
        "rawText": text,
    }
