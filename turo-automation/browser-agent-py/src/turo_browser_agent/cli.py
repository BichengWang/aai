from __future__ import annotations

import json
import sys

from .flows.health_smoke import run_health_smoke
from .flows.messages_list import run_messages_list
from .flows.session_bootstrap import run_session_bootstrap
from .flows.session_check import run_session_check
from .flows.trip_get import run_trip_get
from .flows.trips_list import run_trips_list

COMMANDS = {
    "health-smoke": run_health_smoke,
    "messages-list": run_messages_list,
    "session-bootstrap": run_session_bootstrap,
    "session-check": run_session_check,
    "trips-list": run_trips_list,
    "trip-get": run_trip_get,
}



def main() -> int:
    if len(sys.argv) < 2:
        sys.stderr.write(json.dumps({"ok": False, "error": "Missing command"}, indent=2) + "\n")
        return 1

    command = sys.argv[1]
    handler = COMMANDS.get(command)
    if handler is None:
        sys.stderr.write(json.dumps({"ok": False, "error": f"Unknown command: {command}"}, indent=2) + "\n")
        return 1

    result = handler(sys.argv[2:])
    sys.stdout.write(json.dumps(result.to_dict(), indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
