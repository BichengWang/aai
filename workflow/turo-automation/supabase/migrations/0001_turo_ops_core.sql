create extension if not exists pgcrypto;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vin text unique,
  plate text unique,
  nickname text,
  make text not null,
  model text not null,
  year integer,
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  location text,
  odometer integer,
  fuel_type text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  full_name text not null,
  phone text,
  email text,
  driver_license_last4 text,
  rating numeric(3, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  external_trip_id text unique,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  guest_id uuid not null references public.guests (id) on delete restrict,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed', 'cancelled', 'issue')),
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  actual_return_at timestamptz,
  pickup_location text,
  return_location text,
  trip_total_amount numeric(12, 2),
  delivery_required boolean not null default false,
  source text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  type text not null check (type in ('prep', 'cleaning', 'delivery', 'pickup_check', 'return_check', 'late_return_followup', 'incident_followup', 'admin')),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (trip_id is not null or vehicle_id is not null)
);

create index if not exists vehicles_status_idx on public.vehicles (status);
create index if not exists guests_email_idx on public.guests (email);
create index if not exists guests_phone_idx on public.guests (phone);
create index if not exists trips_vehicle_pickup_idx on public.trips (vehicle_id, pickup_at desc);
create index if not exists trips_guest_pickup_idx on public.trips (guest_id, pickup_at desc);
create index if not exists trips_status_idx on public.trips (status);
create index if not exists tasks_trip_status_due_idx on public.tasks (trip_id, status, due_at);
create index if not exists tasks_vehicle_status_due_idx on public.tasks (vehicle_id, status, due_at);
create index if not exists tasks_priority_status_idx on public.tasks (priority, status);

alter table public.vehicles enable row level security;
alter table public.guests enable row level security;
alter table public.trips enable row level security;
alter table public.tasks enable row level security;

create policy "Enable read access for authenticated users on vehicles"
on public.vehicles
for select
using (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on guests"
on public.guests
for select
using (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on trips"
on public.trips
for select
using (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users on tasks"
on public.tasks
for select
using (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on vehicles"
on public.vehicles
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on guests"
on public.guests
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on trips"
on public.trips
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Enable write access for authenticated users on tasks"
on public.tasks
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at
before update on public.vehicles
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_guests_updated_at on public.guests;
create trigger set_guests_updated_at
before update on public.guests
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_trips_updated_at on public.trips;
create trigger set_trips_updated_at
before update on public.trips
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_row_updated_at();
