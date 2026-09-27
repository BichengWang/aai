# Data Model Draft

Initial schema draft for the Turo Automation MVP.

## Design Goals
- model the real operational lifecycle of a trip
- support task generation and assignment
- support guest communication history and approvals
- capture incidents without over-designing claims workflows too early

## Core Entities

### `vehicles`
Represents each car in the fleet.

Suggested fields:
- `id`
- `vin`
- `plate`
- `nickname`
- `make`
- `model`
- `year`
- `status` (`active`, `maintenance`, `inactive`)
- `location`
- `odometer`
- `fuel_type`
- `notes`
- `created_at`
- `updated_at`

### `guests`
Represents the guest / driver.

Suggested fields:
- `id`
- `first_name`
- `last_name`
- `full_name`
- `phone`
- `email`
- `driver_license_last4`
- `rating`
- `notes`
- `created_at`
- `updated_at`

### `trips`
Represents each reservation / booking lifecycle.

Suggested fields:
- `id`
- `external_trip_id`
- `vehicle_id`
- `guest_id`
- `status` (`upcoming`, `active`, `completed`, `cancelled`, `issue`)
- `pickup_at`
- `return_at`
- `actual_return_at`
- `pickup_location`
- `return_location`
- `trip_total_amount`
- `delivery_required` (boolean)
- `source`
- `notes`
- `created_at`
- `updated_at`

### `tasks`
Operational tasks created manually or automatically.

Suggested fields:
- `id`
- `trip_id` (nullable)
- `vehicle_id` (nullable)
- `type` (`prep`, `cleaning`, `delivery`, `pickup_check`, `return_check`, `late_return_followup`, `incident_followup`, `admin`)
- `title`
- `description`
- `status` (`todo`, `in_progress`, `blocked`, `done`, `cancelled`)
- `priority` (`low`, `medium`, `high`, `urgent`)
- `assigned_to`
- `due_at`
- `completed_at`
- `created_by`
- `created_at`
- `updated_at`

### `message_threads`
Conversation record and message workflow state.

Suggested fields:
- `id`
- `trip_id`
- `guest_id`
- `channel` (`turo`, `sms`, `whatsapp`, `email`, `slack_internal`)
- `status` (`drafting`, `awaiting_approval`, `sent`, `failed`, `closed`)
- `last_message_at`
- `owner_id`
- `created_at`
- `updated_at`

### `messages`
Individual outbound or inbound messages.

Suggested fields:
- `id`
- `thread_id`
- `direction` (`inbound`, `outbound`)
- `body`
- `draft_body`
- `approval_status` (`not_needed`, `pending`, `approved`, `rejected`)
- `sent_at`
- `sender_type` (`guest`, `agent`, `system`, `team_member`)
- `created_at`
- `updated_at`

### `incidents`
Operational exceptions and issues.

Suggested fields:
- `id`
- `trip_id`
- `vehicle_id`
- `type` (`late_return`, `damage`, `cleaning`, `smoking`, `toll`, `ticket`, `mechanical`, `other`)
- `severity` (`low`, `medium`, `high`, `critical`)
- `status` (`open`, `investigating`, `waiting`, `resolved`, `closed`)
- `summary`
- `details`
- `owner_id`
- `opened_at`
- `resolved_at`
- `created_at`
- `updated_at`

### `trip_events`
Normalized timeline of important booking lifecycle events.

Suggested fields:
- `id`
- `trip_id`
- `event_type`
- `event_time`
- `source`
- `payload_json`
- `created_at`

## Initial Relationships
- one `vehicle` has many `trips`
- one `guest` has many `trips`
- one `trip` has many `tasks`
- one `trip` has many `message_threads`
- one `message_thread` has many `messages`
- one `trip` has many `incidents`
- one `trip` has many `trip_events`

## MVP Notes
- keep pricing and analytics tables out of v1 schema
- keep claims-specific entities out of v1 unless incident complexity demands them
- prefer event history (`trip_events`) over mutating status blindly
- design messaging tables so AI draft + human approval is first-class
