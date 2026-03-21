-- Migration: add incidents, trip_events, message_threads, message_drafts,
--             approval_requests, job_runs
-- Depends on: 0001_turo_ops_core.sql (vehicles, guests, trips, tasks)

-- ---------------------------------------------------------------------------
-- incidents
-- ---------------------------------------------------------------------------
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips (id) on delete set null,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  type text not null check (type in (
    'late_return', 'damage', 'cleaning', 'smoking', 'toll', 'ticket',
    'mechanical', 'other'
  )),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in (
    'open', 'investigating', 'waiting', 'resolved', 'closed'
  )),
  summary text not null,
  details text,
  owner_id text,
  opened_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (trip_id is not null or vehicle_id is not null)
);

-- ---------------------------------------------------------------------------
-- trip_events
-- ---------------------------------------------------------------------------
create table if not exists public.trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  event_type text not null,
  event_time timestamptz not null,
  source text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- message_threads
-- ---------------------------------------------------------------------------
create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete restrict,
  channel text not null check (channel in ('turo', 'sms', 'whatsapp', 'email', 'slack_internal')),
  status text not null default 'drafting' check (status in (
    'drafting', 'awaiting_approval', 'ready_for_review', 'sent', 'failed', 'closed'
  )),
  last_message_at timestamptz,
  owner_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- message_drafts
-- ---------------------------------------------------------------------------
create table if not exists public.message_drafts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  direction text not null default 'outbound' check (direction in ('inbound', 'outbound')),
  channel text not null check (channel in ('turo', 'sms', 'whatsapp', 'email', 'slack_internal')),
  body text not null,
  template_key text not null default '',
  approval_status text not null default 'not_needed' check (approval_status in (
    'not_needed', 'pending', 'approved', 'rejected'
  )),
  state text not null default 'drafting' check (state in (
    'drafting', 'awaiting_approval', 'ready_for_review', 'sent', 'failed', 'closed'
  )),
  requested_by text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- approval_requests
-- ---------------------------------------------------------------------------
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.message_drafts (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by text not null,
  reviewed_by text,
  requested_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  notes text
);

-- ---------------------------------------------------------------------------
-- job_runs
-- ---------------------------------------------------------------------------
create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null check (job_name in (
    'today_ops_snapshot', 'trip_import', 'lifecycle_tasks', 'late_return_scan', 'daily_digest'
  )),
  status text not null default 'planned' check (status in ('planned', 'running', 'completed', 'failed')),
  started_at timestamptz not null,
  finished_at timestamptz,
  summary text not null default '',
  issue_count integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists incidents_trip_status_idx on public.incidents (trip_id, status);
create index if not exists incidents_vehicle_status_idx on public.incidents (vehicle_id, status);
create index if not exists incidents_status_severity_idx on public.incidents (status, severity);
create index if not exists trip_events_trip_time_idx on public.trip_events (trip_id, event_time desc);
create index if not exists message_threads_trip_idx on public.message_threads (trip_id);
create index if not exists message_threads_guest_idx on public.message_threads (guest_id);
create index if not exists message_drafts_thread_idx on public.message_drafts (thread_id);
create index if not exists message_drafts_approval_status_idx on public.message_drafts (approval_status);
create index if not exists approval_requests_draft_idx on public.approval_requests (draft_id);
create index if not exists approval_requests_status_idx on public.approval_requests (status);
create index if not exists job_runs_job_name_started_idx on public.job_runs (job_name, started_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.incidents enable row level security;
alter table public.trip_events enable row level security;
alter table public.message_threads enable row level security;
alter table public.message_drafts enable row level security;
alter table public.approval_requests enable row level security;
alter table public.job_runs enable row level security;

create policy "Enable read access for authenticated users on incidents"
on public.incidents for select using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on incidents"
on public.incidents for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on trip_events"
on public.trip_events for select using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on trip_events"
on public.trip_events for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on message_threads"
on public.message_threads for select using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on message_threads"
on public.message_threads for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on message_drafts"
on public.message_drafts for select using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on message_drafts"
on public.message_drafts for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on approval_requests"
on public.approval_requests for select using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on approval_requests"
on public.approval_requests for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on job_runs"
on public.job_runs for select using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on job_runs"
on public.job_runs for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- updated_at triggers (no trip_events or approval_requests — they are immutable)
-- ---------------------------------------------------------------------------
drop trigger if exists set_incidents_updated_at on public.incidents;
create trigger set_incidents_updated_at
before update on public.incidents
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_message_threads_updated_at on public.message_threads;
create trigger set_message_threads_updated_at
before update on public.message_threads
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_message_drafts_updated_at on public.message_drafts;
create trigger set_message_drafts_updated_at
before update on public.message_drafts
for each row
execute function public.set_row_updated_at();
