# Agents team workspace

A cloud-native take on [Orca](https://github.com/stablyai/orca): parallel agent workspaces and one "Needs you" list, rebuilt so that agents run in the cloud and sit on the team roster next to people. The UI starts as an MVP and grows only when a page is needed.

| Diagram | What it shows |
| --- | --- |
| [architecture.svg](./architecture.svg) | Planes, owners and the one contract that crosses between the repos. Steps ① to ⑪ follow a task to a merged PR. |
| [ui-layout.svg](./ui-layout.svg) | The MVP UI: a Team page (Needs you, Working, Done under the mission line) and a Run page (one timeline that ends in the decision). |
| [lifecycle.svg](./lifecycle.svg) | Mission, run, attempt and gate state machines, including timeouts, retries and how a run ends. |

## Where the code lives

The split is between control and execution, not between web and runtime.

- **aai** owns the web UI (`homepage/src/features/team`), the control plane (Supabase Postgres, Edge Functions, pg_cron jobs, Realtime) and the runtime contract (`contracts/runtime/v1`). Anything that needs a tenant, a human decision, a timer longer than one attempt, credential custody, money or a GitHub or Slack write belongs here.
- **[multi-agents](https://github.com/BichengWang/multi-agents)** owns a stateless execution plane on Modal: the attempt driver, sandboxes, the per-attempt model gateway, the key unsealer, `publish`, and the workflow patterns (Sequential, RefineLoop, BestOfN, Router). It holds no database keys, and any of its processes can die without losing work.
- Only the contract crosses the seam: dispatch and control messages go down, run events and capabilities come up. Both repos validate the same golden fixtures.

## Load-bearing decisions

- **Postgres is the system of record.** Runs, attempts, the event journal, gates, the outbox and missions live in one database. Realtime only signals; clients backfill by sequence number, so the UI stays correct when compute is down.
- **Writes go through RPCs that authorize on the target row.** `authenticated` gets select-only RLS; platform settings such as `agents_enabled` and budgets belong to platform admins, not workspace owners.
- **Every attempt is a fenced lease.** A lost worker is retried on the same lane, and infrastructure losses do not use up the agent's attempts.
- **Sandboxes hold no secrets.** Setup runs with registry access and is snapshotted; the agent phase can only reach its own gateway, which allowlists request fields and reserves budget before each call.
- **`publish` is the only way to GitHub.** It rebuilds each change as one commit authored by BichengWang and checks attribution and secrets before pushing. Merges need green required checks, plus an approval for the exact head SHA unless every path is on the auto-merge allowlist.
- **Progress, not liveness, decides "stalled".** "Landed" comes only from GitHub's merged state, and a mission with no progress for 2 hours re-alerts every 30 minutes until it recovers or someone stops it.

## Delivery order

Small PRs, each verified end to end:

1. Lock down the public schema and start tracked migrations; add one always-run required check and an attribution guard in both repos.
2. Runtime contract v1; the `/team` shell; slim multi-agents dependencies.
3. Team tenancy, then the mission ledger over today's hand-run loop (observe mode), with Slack status and the stall supervisor.
4. Run journal and ingest, leases and retries, then the Modal driver and dispatch.
5. Sealed credentials and budgets, gateway and unsealer, two-phase sandboxes, publish, and the first cloud mission on aai.
6. Only when needed: a missions page, roster, settings, health, phone gates, workflow lanes and race compare.
