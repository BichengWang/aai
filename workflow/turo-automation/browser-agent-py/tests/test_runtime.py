from __future__ import annotations

from pathlib import Path
import sys
import unittest
from tempfile import TemporaryDirectory
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from turo_browser_agent.runtime import capture_page_failure_artifacts, read_page_body_text


class _Locator:
    def __init__(self, text: str | None = None, *, should_fail: bool = False) -> None:
        self._text = text
        self._should_fail = should_fail

    def inner_text(self, timeout: int = 0) -> str:
        if self._should_fail:
            raise TimeoutError("timed out")
        return self._text or ""


class _Page:
    def __init__(
        self,
        *,
        evaluate_text: str | None = None,
        locator_text: str | None = None,
        evaluate_fails: bool = False,
        locator_fails: bool = False,
    ) -> None:
        self._evaluate_text = evaluate_text
        self._locator_text = locator_text
        self._evaluate_fails = evaluate_fails
        self._locator_fails = locator_fails

    def evaluate(self, script: str) -> str:
        if self._evaluate_fails:
            raise RuntimeError("evaluate failed")
        return self._evaluate_text or ""

    def locator(self, selector: str) -> _Locator:
        return _Locator(self._locator_text, should_fail=self._locator_fails)


class _ArtifactPage:
    def screenshot(self, path: str, full_page: bool = False) -> None:
        Path(path).write_bytes(b"fake-png")

    def content(self) -> str:
        return "<html><body>failure</body></html>"


class RuntimeTests(unittest.TestCase):
    def test_read_page_body_text_uses_evaluation_result_first(self) -> None:
        page = _Page(evaluate_text="  hello world  ", locator_text="ignored")

        text, warnings = read_page_body_text(page, limit=20)

        self.assertEqual(text, "  hello world  ")
        self.assertEqual(warnings, [])

    def test_read_page_body_text_falls_back_to_locator_when_evaluation_fails(self) -> None:
        page = _Page(locator_text="locator fallback", evaluate_fails=True)

        text, warnings = read_page_body_text(page, limit=20)

        self.assertEqual(text, "locator fallback")
        self.assertEqual(len(warnings), 1)
        self.assertIn("Body text capture via evaluation failed", warnings[0])

    def test_read_page_body_text_reports_locator_failure(self) -> None:
        page = _Page(evaluate_text="", locator_fails=True)

        text, warnings = read_page_body_text(page, limit=20)

        self.assertEqual(text, "")
        self.assertEqual(len(warnings), 1)
        self.assertIn("Body text capture via locator failed", warnings[0])

    def test_capture_page_failure_artifacts_keeps_error_warning_and_files(self) -> None:
        with TemporaryDirectory() as tmpdir:
            config = SimpleNamespace(artifacts_dir=Path(tmpdir))
            page = _ArtifactPage()

            artifacts, warnings = capture_page_failure_artifacts(page, config, "session-check", "Failure message")

            self.assertEqual(len(warnings), 1)
            self.assertEqual(warnings[0], "Failure message")
            self.assertEqual(len(artifacts), 2)
            self.assertTrue(any(path.endswith(".png") for path in artifacts))
            self.assertTrue(any(path.endswith(".html") for path in artifacts))


if __name__ == "__main__":
    unittest.main()
