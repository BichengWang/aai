# Incident Response Runbook

Steps for handling open incidents detected by the automation system.

---

## Incident Types

| Type | Auto-detected | Typical cause |
|---|---|---|
| `late_return` | Yes | Guest hasn't returned past scheduled return time |
| `other` (trip issue) | Yes | Trip status set to `issue` in the source system |
| `damage` | No — manual | Guest reports damage; photos required |
| `mechanical` | No — manual | Warning light or breakdown reported during trip |
| `cleaning` | No — manual | Vehicle returned in unacceptable condition |
| `toll` / `ticket` | No — manual | Unexpected charges discovered post-trip |

---

## Response Steps by Severity

### High / Critical

1. Acknowledge the incident in the dashboard within 30 minutes.
2. Attempt guest contact immediately (Turo message + phone if available).
3. Document all contact attempts and guest responses as incident notes.
4. If vehicle is unreachable: notify Turo support and file a claim if applicable.
5. Update incident status to `investigating` once initial outreach is made.

### Medium

1. Acknowledge within 2 hours.
2. Reach out to guest if the trip is still active.
3. Collect evidence (photos, odometer, GPS if available).
4. Update status to `waiting` if awaiting guest response.

### Low

1. Review at end-of-day.
2. Resolve or close with a note if no action required.

---

## Status Transitions

```
open → investigating → waiting → resolved → closed
                             ↓
                           closed (if dispute dropped)
```

- **open**: newly created by the automation system.
- **investigating**: host has acknowledged and is actively researching.
- **waiting**: pending response from guest, Turo, or insurer.
- **resolved**: root cause addressed, no further action needed.
- **closed**: administrative closure (duplicate, false alarm, etc.).

---

## Late Return SLA

| Time past return | Expected action |
|---|---|
| 0–30 min | Monitor; send automated return reminder if draft pending |
| 30–60 min | Send Turo message; call if number available |
| 60–120 min | Escalate to Turo support |
| 2h+ | Consider filing a claim; update incident to `waiting` |

---

## Post-Incident Cleanup

1. Mark the associated trip task (`late_return_followup`) as `done`.
2. Resolve the incident once the vehicle is returned and situation is closed.
3. Add notes summarizing outcome for future reference.
4. If pattern detected (repeat guest behavior), add a guest note.
