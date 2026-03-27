# Milestone 2 — Modular Host Systems

## Goal
Refactor the first milestone browser-assist work into host-page-aligned modules so the system can grow in the same shape as the Turo host product surface.

This milestone is about structure, boundaries, and read-first/operator-safe coverage before broader write automation.

## Module Map
The module set should follow the host navigation and page model:

1. `calendar-system`
2. `trips-system`
3. `inbox-system`
4. `vehicles-system`
5. `business-system`
6. `more-system`
7. `user-profile-system`
8. `switch-to-guest`

## Refactor Principle
- keep common browser/runtime/auth/page-state/artifact logic shared
- move page-specific extraction, parsing, and commands behind module boundaries
- preserve read-only-first behavior by default
- treat guest-facing writes as separately gated workflows
- prefer end-to-end verification on real pages over broad unit-test expansion

## Current Flow Mapping
### Already implemented flows
- Session management foundation
  - `health:smoke`
  - `session:bootstrap`
  - `session:check`
- Trips-aligned flows
  - `trips:list`
  - `trip-get`
- Inbox-aligned flows
  - `messages:list`

### Proposed module ownership
#### Shared core
Owns cross-cutting pieces that should not live inside page modules:
- browser launch / attach
- auth bootstrap + state reuse
- page-state detection
- failure artifact capture
- text/body capture helpers
- shared JS extract fragments
- result envelope / output contracts

#### Calendar system
Scope:
- host calendar landing page discovery
- read-only calendar event/list extraction
- trip-to-calendar reconciliation helpers later

Initial plan:
- define calendar page URL + detection rules
- add `calendar:list` read-only flow
- extract visible calendar entries conservatively
- save artifacts + concise operator summary

#### Trips system
Scope:
- trip list
- trip detail
- trip state and reservation metadata
- trip timeline/event extraction later

Current assets to absorb:
- `trips:list`
- `trip-get`
- trip parsing helpers and summaries

Next plan:
- move current trip flows under explicit trips module boundaries
- add richer trip detail fields only when verified on real pages
- add trip events / timeline read model if page support is stable

#### Inbox system
Scope:
- thread list
- thread detail
- draft/send flow later behind explicit approval gate

Current assets to absorb:
- `messages:list`

Next plan:
- move current messages flow under explicit inbox module boundaries
- add `message-thread-get` read-only flow
- only after stable read coverage, design manual send/draft actions with strong confirmation

#### Vehicles system
Scope:
- vehicle list
- vehicle detail
- status/readiness/availability metadata

Initial plan:
- define vehicles landing page flow
- add `vehicles:list` read-only extraction
- add conservative vehicle summary parser

#### Business system
Scope:
- performance/business dashboard surfaces
- earnings / metrics / utilization views where accessible

Initial plan:
- map reachable business pages first
- add read-only business summary flow only after page shape is validated

#### More system
Scope:
- settings-like secondary host surfaces not covered above
- support/help/tools pages if useful for operator workflows

Initial plan:
- inventory links and reachable sub-pages
- create docs-only map before code unless a high-value flow emerges

#### User profile system
Scope:
- profile/account/navigation state
- host identity and account status checks

Initial plan:
- add lightweight `profile:check` read-only flow
- extract account/header identity signals conservatively

#### Switch to guest
Scope:
- guest-mode handoff or context switch entry points
- navigation/state verification around host→guest transition

Initial plan:
- document exact UI entry points first
- keep this read-only until navigation and safety implications are understood

## Milestone 2 PR Strategy
Prefer small PR slices that establish the module skeleton first, then migrate existing flows, then add one new read-only flow at a time.

### Wave 1 — Structural refactor
1. create explicit module directories and command grouping
2. move shared runtime/auth/page-state/helpers into a stable core module
3. re-home current trips and inbox flows into the new module structure
4. update docs/architecture/plan to describe the module map

### Wave 2 — Existing flow migration hardening
5. preserve current `trips:list` behavior under `trips-system`
6. preserve current `trip-get` behavior under `trips-system`
7. preserve current `messages:list` behavior under `inbox-system`
8. ensure session flows still work with the new module layout

### Wave 3 — New module coverage
9. add first `calendar-system` read-only flow
10. add first `vehicles-system` read-only flow
11. add first `user-profile-system` read-only flow
12. inventory/document `business`, `more`, and `switch-to-guest` before code or add one small verified read flow if clearly ready

## Verification Standard
For this project, prefer:
- real-page end-to-end checks on authenticated host pages
- conservative parsers that fail soft with artifacts
- concise operator-readable summaries
- docs updated every time architecture or command layout changes

## Non-Goals for Milestone 2
- broad unattended write automation
- blind guest messaging sends
- forcing coverage for every host page before the structure is clean
- coupling browser-assist modules tightly into the worker critical path

## Exit Criteria
Milestone 2 is in good shape when:
- the browser-agent codebase is reorganized into the host-page-aligned module map
- existing trips/inbox flows cleanly fit the new structure
- at least the first additional modules beyond trips/inbox are live in read-only form
- docs clearly explain where each automation belongs and what is still gated
