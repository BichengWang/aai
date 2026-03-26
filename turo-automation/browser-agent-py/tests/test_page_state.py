from __future__ import annotations

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from turo_browser_agent.page_state import page_looks_blocked, page_looks_login_required


class PageStateTests(unittest.TestCase):
    def test_page_looks_login_required_matches_routes_and_prompts(self) -> None:
        self.assertTrue(page_looks_login_required("Trips", "https://turo.com/login", ""))
        self.assertTrue(page_looks_login_required("Trips", "", "Continue with Google"))
        self.assertFalse(page_looks_login_required("Trips", "", "Authenticated content"))

    def test_page_looks_blocked_matches_title_or_body_copy(self) -> None:
        self.assertTrue(page_looks_blocked("You've been blocked", ""))
        self.assertTrue(page_looks_blocked("Trips", "You’ve been blocked due to unusual activity"))
        self.assertFalse(page_looks_blocked("Trips", "Authenticated content"))


if __name__ == "__main__":
    unittest.main()
