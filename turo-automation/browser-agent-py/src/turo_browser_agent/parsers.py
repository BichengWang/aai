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
RESERVATION_PATH_RE = re.compile(r"/reservation/(\d+)")
RESERVATION_TEXT_RE = re.compile(r"(?:reservation\s*#?\s*|#)(\d{6,})", re.IGNORECASE)
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


def extract_trip_status(*values: str | None) -> str | None:
    haystack = " ".join(value for value in values if value).lower()
    for candidate in TRIP_STATUS_CANDIDATES:
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


def normalize_trip_item(raw: Mapping[str, str | None]) -> dict[str, str | None]:
    text = raw.get("text", "") or ""
    return {
        "title": raw.get("title") or text[:120] or None,
        "status": extract_trip_status(text, raw.get("badge")),
        "href": raw.get("href"),
        "location": raw.get("location"),
        "guest": raw.get("actor"),
        "reservationId": raw.get("reservationId") or extract_reservation_id(raw.get("href"), text),
        "rawText": text,
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

    return {
        "headline": headline,
        "vehicle": vehicle or headline,
        "status": extract_trip_status(" ".join(headings), " ".join(badges), " ".join(key_lines), body_text),
        "reservationId": extract_reservation_id(final_url, *headings, *key_lines, body_text),
        "guest": guest,
        "pickup": pickup,
        "return": trip_return,
        "location": location,
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

    return {
        "title": title,
        "guest": guest,
        "status": status,
        "unread": bool(raw.get("unread", False)),
        "href": raw.get("href"),
        "reservationId": reservation_id,
        "lastMessageAt": raw.get("lastMessageAt"),
        "rawText": text,
    }
