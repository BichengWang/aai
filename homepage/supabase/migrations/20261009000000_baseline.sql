create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  auth_provider text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at on public.profiles;
create trigger set_profile_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    email,
    full_name,
    avatar_url,
    auth_provider
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.raw_app_meta_data ->> 'provider'
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    auth_provider = coalesce(excluded.auth_provider, public.profiles.auth_provider);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
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

create table if not exists public.provider_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic', 'gemini')),
  label text not null,
  encrypted_secret text not null,
  secret_mask text not null,
  status text not null default 'pending' check (status in ('pending', 'valid', 'invalid', 'error')),
  validation_error text,
  last_validated_at timestamptz,
  monthly_token_cap bigint,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_credentials_user_id_idx on public.provider_credentials (user_id);
create index if not exists provider_credentials_provider_idx on public.provider_credentials (provider);

alter table public.provider_credentials enable row level security;

drop policy if exists "Users can view their own provider credentials" on public.provider_credentials;
create policy "Users can view their own provider credentials"
on public.provider_credentials
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own provider credentials" on public.provider_credentials;
create policy "Users can insert their own provider credentials"
on public.provider_credentials
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own provider credentials" on public.provider_credentials;
create policy "Users can update their own provider credentials"
on public.provider_credentials
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists set_provider_credentials_updated_at on public.provider_credentials;
create trigger set_provider_credentials_updated_at
before update on public.provider_credentials
for each row
execute function public.set_row_updated_at();

create table if not exists public.managed_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  key_name text not null,
  secret_hash text not null,
  secret_preview text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists managed_api_keys_user_id_idx on public.managed_api_keys (user_id);

alter table public.managed_api_keys enable row level security;

drop policy if exists "Users can view their own managed api key" on public.managed_api_keys;
create policy "Users can view their own managed api key"
on public.managed_api_keys
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own managed api key" on public.managed_api_keys;
create policy "Users can insert their own managed api key"
on public.managed_api_keys
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own managed api key" on public.managed_api_keys;
create policy "Users can update their own managed api key"
on public.managed_api_keys
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists set_managed_api_keys_updated_at on public.managed_api_keys;
create trigger set_managed_api_keys_updated_at
before update on public.managed_api_keys
for each row
execute function public.set_row_updated_at();

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists conversations_user_id_last_message_idx on public.conversations (user_id, last_message_at desc);

alter table public.conversations enable row level security;

drop policy if exists "Users can view their own conversations" on public.conversations;
create policy "Users can view their own conversations"
on public.conversations
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own conversations" on public.conversations;
create policy "Users can insert their own conversations"
on public.conversations
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own conversations" on public.conversations;
create policy "Users can update their own conversations"
on public.conversations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row
execute function public.set_row_updated_at();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  provider text check (provider in ('openai', 'anthropic', 'gemini')),
  model text,
  routing_mode text not null default 'auto' check (routing_mode in ('auto', 'manual')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "Users can view messages for their conversations" on public.messages;
create policy "Users can view messages for their conversations"
on public.messages
for select
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert messages for their conversations" on public.messages;
create policy "Users can insert messages for their conversations"
on public.messages
for insert
with check (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
  )
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id uuid references public.provider_credentials (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  provider text not null check (provider in ('openai', 'anthropic', 'gemini')),
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists usage_events_user_id_created_idx on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_credential_id_created_idx on public.usage_events (credential_id, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "Users can view their own usage events" on public.usage_events;
create policy "Users can view their own usage events"
on public.usage_events
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own usage events" on public.usage_events;
create policy "Users can insert their own usage events"
on public.usage_events
for insert
with check (auth.uid() = user_id);

create table if not exists public.sso_handoffs (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  encrypted_session_payload text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sso_handoffs_user_id_idx on public.sso_handoffs (user_id);
create index if not exists sso_handoffs_expiry_idx on public.sso_handoffs (expires_at);

alter table public.sso_handoffs enable row level security;

create or replace view public.workspace_usage_summary as
select
  usage_events.user_id,
  usage_events.provider,
  coalesce(sum(usage_events.total_tokens), 0)::bigint as total_tokens,
  coalesce(sum(usage_events.estimated_cost_usd), 0)::numeric(12, 6) as estimated_cost_usd
from public.usage_events
group by usage_events.user_id, usage_events.provider;
