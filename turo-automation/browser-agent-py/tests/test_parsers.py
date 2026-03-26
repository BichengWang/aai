from __future__ import annotations

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from turo_browser_agent.parsers import normalize_trip_detail, normalize_trip_item, resolve_trip_target


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


if __name__ == "__main__":
    unittest.main()
