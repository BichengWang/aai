from __future__ import annotations

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from turo_browser_agent.modules.trips.detail import run_trip_get


class TripGetTests(unittest.TestCase):
    def test_run_trip_get_requires_target_before_browser_work(self) -> None:
        result = run_trip_get([])
        payload = result.to_dict()

        self.assertFalse(payload["ok"])
        self.assertEqual(payload["workflow"], "trip:get")
        self.assertEqual(payload["data"]["status"], "missing_target")
        self.assertEqual(
            payload["warnings"],
            ["Missing trip target. Usage: ./run trip-get <reservation-id-or-url>"],
        )


if __name__ == "__main__":
    unittest.main()
