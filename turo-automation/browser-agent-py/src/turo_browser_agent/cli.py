from __future__ import annotations

import json
import sys

from .modules.core.health import run_health_smoke
from .modules.calendar.list import run_calendar_list
from .modules.core.session_bootstrap import run_session_bootstrap
from .modules.core.session_check import run_session_check
from .modules.inbox.list import run_messages_list
from .modules.trips.detail import run_trip_get
from .modules.trips.list import run_trips_list
from .modules.vehicles.list import run_vehicles_list

COMMANDS = {
    "health-smoke": run_health_smoke,
    "calendar-list": run_calendar_list,
    "messages-list": run_messages_list,
    "session-bootstrap": run_session_bootstrap,
    "session-check": run_session_check,
    "trips-list": run_trips_list,
    "trip-get": run_trip_get,
    "vehicles-list": run_vehicles_list,
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
