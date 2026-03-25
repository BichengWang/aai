from __future__ import annotations

import io
from contextlib import redirect_stdout
from pathlib import Path
import sys
from unittest import mock
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from turo_browser_agent import cli


class _FakeResult:
    def __init__(self, payload: dict[str, object]) -> None:
        self._payload = payload

    def to_dict(self) -> dict[str, object]:
        return self._payload


class CliTests(unittest.TestCase):
    def test_main_forwards_command_args_to_handler(self) -> None:
        observed: list[list[str]] = []

        def handler(args: list[str] | None = None) -> _FakeResult:
            observed.append(args or [])
            return _FakeResult({"ok": True, "args": args or []})

        stdout = io.StringIO()
        with mock.patch.object(sys, "argv", ["turo-browser-agent", "trip-get", "54848775"]):
            with mock.patch.dict(cli.COMMANDS, {"trip-get": handler}):
                with redirect_stdout(stdout):
                    exit_code = cli.main()

        self.assertEqual(exit_code, 0)
        self.assertEqual(observed, [["54848775"]])
        self.assertIn('"args": [\n    "54848775"\n  ]', stdout.getvalue())


if __name__ == "__main__":
    unittest.main()
