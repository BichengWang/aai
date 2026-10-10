drop view if exists public.workspace_usage_summary;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

drop policy if exists "Users can insert their own provider credentials" on public.provider_credentials;
drop policy if exists "Users can update their own provider credentials" on public.provider_credentials;
drop policy if exists "Users can insert their own usage events" on public.usage_events;

revoke insert, update on public.provider_credentials from public, anon, authenticated;
revoke insert on public.usage_events from public, anon, authenticated;

-- Table-level SELECT overrides column restrictions, so replace it with an allowlist.
revoke select on public.provider_credentials from public, anon, authenticated;
revoke select (encrypted_secret) on public.provider_credentials from public, anon, authenticated;
grant select (
  id, user_id, provider, label, secret_mask, status, validation_error,
  last_validated_at, monthly_token_cap, created_at, updated_at
) on public.provider_credentials to authenticated;
