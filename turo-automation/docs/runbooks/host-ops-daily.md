# Host Ops Daily Runbook

Standard operating procedure for Turo host daily operations using the automation dashboard.

---

## Morning Check (before 9 AM)

1. **Open the dashboard** (`web/`) and verify load state shows "ready".

2. **Review pickups** in the "Today's pickups" section.
   - Confirm each upcoming trip has a prep task assigned.
   - If a delivery is required (`delivery` pill), verify staging location and timing.

3. **Review approval queue**.
   - For each pending approval, open the draft body and verify the content.
   - Click **Approve** if the message is ready to send, or **Reject** to flag for revision.
   - Target: clear the approval queue within 2 hours of the worker's morning run.

4. **Check overdue tasks**.
   - Any task more than 30 minutes past due should be escalated or reassigned.
   - Priority: `urgent` > `high` > `medium` > `low`.

5. **Review active incidents**.
   - Click an incident row to open the trip timeline side panel.
   - Use **Investigate**, **Waiting**, or **Resolve** in the dashboard when the status changes.
   - Confirm the row refreshes after the action before moving on.

---

## Pre-Trip Checklist (2 hours before pickup)

1. Confirm vehicle is staged at the correct pickup location.
2. Confirm pre-trip message draft was approved and queued.
3. Verify guest contact info is current (check Turo app).
4. Mark the `prep` task as `done` once vehicle is ready.

---

## Return Check (day of return)

1. Monitor active trips with return times within 3 hours.
2. If a guest is late (past return time), confirm a `late_return` incident was opened automatically.
3. Contact guest if no response and return is more than 1 hour overdue.
4. Once vehicle is returned, mark the `return_check` task as `done`.

---

## End-of-Day Review

1. Check Worker Health section for any failed jobs.
2. Review active incidents — resolve or update status in the dashboard where possible.
3. Confirm the daily digest was sent to the ops Slack channel.

---

## Alert Thresholds

| Signal | Threshold | Action |
|---|---|---|
| Late return | > 0 minutes past return time | Auto-opens `late_return` incident |
| Pre-trip draft approval | > 4 hours before pickup | Manual escalation if still pending |
| Overdue task | > 30 minutes past due | Reassign or close as stale |
| Worker job failure | Any job `status: failed` | Check logs; restart worker if needed |
| Pending approval | > 24 hours old | Manual review required |

---

## Common Escalation Paths

- **Guest unreachable + late return**: contact Turo support via the platform.
- **Vehicle damage reported**: open a `damage` incident; photograph evidence.
- **Worker not running**: check `WORKER_MODE` env var and process health.
