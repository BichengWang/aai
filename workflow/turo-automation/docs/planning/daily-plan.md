# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-10-08

## Objective
Phase 11 — scheduled worker hardening, one slice per PR (see `implementation-roadmap.md`).

## Today's Priorities
- [x] Phase 11 slice 1: validate `INTERVAL_*_MS` env vars
- [ ] Phase 11 slice 2: define each job once for run-once and scheduled mode
- [ ] Phase 11 slice 3: approved-draft send job in scheduled mode
- [ ] Phase 11 slice 4: daily digest at most once per day
- [ ] Phase 11 slice 5: system clock outside fixture mode
- [ ] Phase 11 slice 6: `HEALTHZ_PORT` validation and listen errors
- [ ] Phase 11 slice 7: graceful shutdown
- [ ] Phase 11 slice 8: log levels
- [ ] Phase 11 slice 9: per-job state in `/healthz`
- [ ] Phase 11 slice 10: closeout

## Risks / Open Questions
- Browser-agent flows remain blocked until a real authenticated Turo session is available.

## Next Suggested Step
Phase 11 slice 2 — collapse the duplicated job blocks in `run()` and `runScheduled()` so later slices change one place.
