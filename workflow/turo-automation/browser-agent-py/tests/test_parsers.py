from __future__ import annotations

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from turo_browser_agent.parsers import (
    normalize_calendar_entry,
    normalize_profile_snapshot,
    normalize_message_thread,
    normalize_trip_detail,
    normalize_trip_item,
    normalize_vehicle_item,
    resolve_trip_target,
)


class ParserTests(unittest.TestCase):
    def test_normalize_trip_item_keeps_reservation_fields(self) -> None:
        item = normalize_trip_item(
            {
                "href": "/us/en/reservation/54848775",
                "text": "Upcoming 2023 Tesla Model 3 San Francisco, CA Alex #54848775",
                "title": "2023 Tesla Model 3",
                "location": "San Francisco, CA",
                "actor": "Alex",
                "reservationId": None,
                "badge": "Upcoming",
            }
        )

        self.assertEqual(item["status"], "Upcoming")
        self.assertEqual(item["reservationId"], "54848775")
        self.assertEqual(item["guest"], "Alex")
        self.assertEqual(item["summary"], "Upcoming · 2023 Tesla Model 3 · Alex · San Francisco, CA · Reservation #54848775")

    def test_normalize_trip_item_recovers_guest_from_title_prefix(self) -> None:
        item = normalize_trip_item(
            {
                "href": "/us/en/reservation/55213565",
                "text": "Upcoming Alex Lee | 2023 Tesla Model 3 San Francisco, CA #55213565",
                "title": "Alex Lee | 2023 Tesla Model 3",
                "location": "San Francisco, CA",
                "actor": None,
                "reservationId": None,
                "badge": "Upcoming",
            }
        )

        self.assertEqual(item["guest"], "Alex Lee")
        self.assertEqual(item["summary"], "Upcoming · Alex Lee | 2023 Tesla Model 3 · Alex Lee · San Francisco, CA · Reservation #55213565")

    def test_resolve_trip_target_accepts_id_path_and_url(self) -> None:
        url_from_id, reservation_id = resolve_trip_target("54848775", "https://turo.com")
        self.assertEqual(url_from_id, "https://turo.com/us/en/reservation/54848775")
        self.assertEqual(reservation_id, "54848775")

        url_from_path, reservation_id = resolve_trip_target("/us/en/reservation/55213565", "https://turo.com")
        self.assertEqual(url_from_path, "https://turo.com/us/en/reservation/55213565")
        self.assertEqual(reservation_id, "55213565")

    def test_normalize_trip_detail_extracts_conservative_summary(self) -> None:
        detail = normalize_trip_detail(
            {
                "headings": ["Trip details", "2023 Tesla Model 3"],
                "badges": ["Upcoming"],
                "keyLines": [
                    "Guest: Alex Example",
                    "Pickup: Tue, Mar 25 at 10:00 AM",
                    "Return: Thu, Mar 27 at 10:00 AM",
                    "San Francisco, CA",
                    "Reservation #54848775",
                ],
            },
            "https://turo.com/us/en/reservation/54848775",
            "Trip details Reservation #54848775 Upcoming Guest: Alex Example Pickup Tue, Mar 25 at 10:00 AM Return Thu, Mar 27 at 10:00 AM San Francisco, CA",
        )

        self.assertEqual(detail["headline"], "2023 Tesla Model 3")
        self.assertEqual(detail["vehicle"], "2023 Tesla Model 3")
        self.assertEqual(detail["status"], "Upcoming")
        self.assertEqual(detail["reservationId"], "54848775")
        self.assertEqual(detail["guest"], "Alex Example")
        self.assertEqual(detail["pickup"], "Tue, Mar 25 at 10:00 AM")
        self.assertEqual(detail["return"], "Thu, Mar 27 at 10:00 AM")
        self.assertEqual(detail["location"], "San Francisco, CA")
        self.assertEqual(
            detail["summary"],
            "Upcoming · 2023 Tesla Model 3 · Alex Example · Tue, Mar 25 at 10:00 AM → Thu, Mar 27 at 10:00 AM · San Francisco, CA",
        )

    def test_normalize_trip_detail_prefers_location_section_over_date_lines(self) -> None:
        detail = normalize_trip_detail(
            {
                "headings": ["Booked trip", "ALASTAIR'S TRIP", "LOCATION"],
                "badges": [],
                "keyLines": [
                    "Booked trip Qinyao's vehicle",
                    "RESERVATION #55213565",
                ],
            },
            "https://turo.com/us/en/reservation/55213565",
            "\n".join(
                [
                    "Booked trip",
                    "Mazda CX-30 2022",
                    "ALASTAIR'S TRIP",
                    "Sun, Mar 22 9:30 AM",
                    "Mon, Mar 23 11:30 PM",
                    "LOCATION",
                    "1487 College Avenue, Palo Alto, CA 94306",
                    "Get directions",
                    "RESERVATION #55213565",
                ]
            ),
        )

        self.assertEqual(detail["reservationId"], "55213565")
        self.assertEqual(detail["pickup"], "Sun, Mar 22 9:30 AM")
        self.assertEqual(detail["return"], "Mon, Mar 23 11:30 PM")
        self.assertEqual(detail["location"], "1487 College Avenue, Palo Alto, CA 94306")
        self.assertEqual(detail["guest"], "Alastair")

    def test_normalize_trip_detail_accepts_at_in_unlabeled_date_lines(self) -> None:
        detail = normalize_trip_detail(
            {
                "headings": ["Trip details", "2022 Mazda CX-30"],
                "badges": ["Booked"],
                "keyLines": ["Guest: Jamie Example", "Reservation #55213565"],
            },
            "https://turo.com/us/en/reservation/55213565",
            "\n".join(
                [
                    "Trip details",
                    "2022 Mazda CX-30",
                    "Booked",
                    "Guest: Jamie Example",
                    "Sun, Mar 22 at 9:30 AM",
                    "Mon, Mar 23 at 11:30 PM",
                    "Reservation #55213565",
                ]
            ),
        )

        self.assertEqual(detail["pickup"], "Sun, Mar 22 at 9:30 AM")
        self.assertEqual(detail["return"], "Mon, Mar 23 at 11:30 PM")

    def test_normalize_trip_detail_cleans_labeled_location_lines(self) -> None:
        detail = normalize_trip_detail(
            {
                "headings": ["Trip details", "2022 Mazda CX-30"],
                "badges": ["Booked"],
                "keyLines": [
                    "Guest: Jamie Example",
                    "Pickup: Tue, Mar 25 at 10:00 AM",
                    "Return: Thu, Mar 27 at 10:00 AM",
                    "Pickup location: San Francisco International Airport",
                    "Reservation #55213565",
                ],
            },
            "https://turo.com/us/en/reservation/55213565",
            "Trip details Booked Guest: Jamie Example Pickup Tue, Mar 25 at 10:00 AM Return Thu, Mar 27 at 10:00 AM Pickup location: San Francisco International Airport",
        )

        self.assertEqual(detail["location"], "San Francisco International Airport")

    def test_normalize_message_thread_extracts_thread_fields(self) -> None:
        thread = normalize_message_thread(
            {
                "href": "/us/en/messages/threads/54848775",
                "text": "Alex Lee 2023 Tesla Model 3 Reservation #54848775 Unread 2m ago",
                "title": "Alex Lee",
                "guest": None,
                "reservationId": None,
                "status": "Unread",
                "lastMessageAt": "2026-03-27T10:00:00.000Z",
                "unread": True,
            }
        )

        self.assertEqual(thread["title"], "Alex Lee")
        self.assertEqual(thread["guest"], "Alex Lee")
        self.assertEqual(thread["reservationId"], "54848775")
        self.assertEqual(thread["status"], "Unread")
        self.assertEqual(thread["summary"], "Alex Lee · Unread · Reservation #54848775")
        self.assertTrue(thread["unread"])
        self.assertEqual(thread["lastMessageAt"], "2026-03-27T10:00:00.000Z")

    def test_normalize_message_thread_recovers_guest_from_title_prefix(self) -> None:
        thread = normalize_message_thread(
            {
                "href": "/us/en/messages/threads/54848775",
                "text": "Alex Lee | 2023 Tesla Model 3 Reservation #54848775 Unread 2m ago",
                "title": "Alex Lee | 2023 Tesla Model 3",
                "guest": None,
                "reservationId": None,
                "status": None,
                "lastMessageAt": None,
                "unread": False,
            }
        )

        self.assertEqual(thread["guest"], "Alex Lee")
        self.assertEqual(thread["summary"], "Alex Lee · Reservation #54848775")

    def test_normalize_calendar_entry_extracts_conservative_fields(self) -> None:
        entry = normalize_calendar_entry(
            {
                "href": "/us/en/reservation/55213565",
                "text": "Booked Alex Lee 2023 Tesla Model 3 Wed, Mar 25 at 10:00 AM San Francisco, CA",
                "title": "Alex Lee | 2023 Tesla Model 3",
                "dateLine": "Wed, Mar 25 at 10:00 AM",
                "status": "Booked",
                "reservationId": None,
                "location": "San Francisco, CA",
            }
        )

        self.assertEqual(entry["title"], "Alex Lee | 2023 Tesla Model 3")
        self.assertEqual(entry["status"], "Booked")
        self.assertEqual(entry["dateLine"], "Wed, Mar 25 at 10:00 AM")
        self.assertEqual(entry["reservationId"], "55213565")
        self.assertEqual(entry["summary"], "Booked · Alex Lee | 2023 Tesla Model 3 · Wed, Mar 25 at 10:00 AM · San Francisco, CA · Reservation #55213565")

    def test_normalize_vehicle_item_extracts_conservative_fields(self) -> None:
        vehicle = normalize_vehicle_item(
            {
                "href": "/us/en/vehicles/vehicle-model-y",
                "text": "Available 2024 Tesla Model Y San Francisco, CA Vehicle #vehicle-model-y",
                "title": "2024 Tesla Model Y",
                "location": "San Francisco, CA",
                "status": "Available",
                "vehicleId": None,
            }
        )

        self.assertEqual(vehicle["title"], "2024 Tesla Model Y")
        self.assertEqual(vehicle["status"], "Available")
        self.assertEqual(vehicle["location"], "San Francisco, CA")
        self.assertEqual(vehicle["vehicleId"], "vehicle-model-y")
        self.assertEqual(vehicle["summary"], "Available · 2024 Tesla Model Y · San Francisco, CA · Vehicle #vehicle-model-y")

    def test_normalize_profile_snapshot_extracts_signals(self) -> None:
        profile = normalize_profile_snapshot(
            {
                "headings": ["Account", "Host profile"],
                "linkTexts": ["Switch to guest", "Trips", "Vehicles"],
            },
            "https://turo.com/us/en/account",
            "Account Host profile Switch to guest Trips Vehicles",
        )

        self.assertEqual(profile["headline"], "Account")
        self.assertEqual(profile["signals"], ["Account", "Host profile", "Switch to guest", "Trips", "Vehicles"])
        self.assertEqual(profile["summary"], "Account · Profile check")


if __name__ == "__main__":
    unittest.main()
