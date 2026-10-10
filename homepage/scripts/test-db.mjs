import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const migrations = await Promise.all(
  ["20261009000000_baseline.sql", "20261009000100_lock_down_public_schema.sql"].map((name) =>
    readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8")
  )
);
const users = ["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"];

for (const withAutoEnable of [false, true]) {
  test(`public schema lockdown with rls_auto_enable ${withAutoEnable ? "present" : "absent"}`, async () => {
    const db = await PGlite.create({ extensions: { pgcrypto } });

    async function asRole(role, userId, probe) {
      await db.exec(`set role ${role}`);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
      try {
        await probe();
      } finally {
        await db.exec("reset role");
        await db.query("select set_config('request.jwt.claim.sub', '', false)");
      }
    }

    async function denied(sql, params = []) {
      await assert.rejects(db.query(sql, params), { code: "42501" });
    }

    async function probeLockdown() {
      assert.equal((await db.query("select to_regclass('public.workspace_usage_summary') as view")).rows[0].view, null);
      assert.deepEqual(
        (await db.query(`
          select policyname from pg_policies
          where schemaname = 'public' and tablename in ('provider_credentials', 'usage_events')
            and cmd in ('INSERT', 'UPDATE')
        `)).rows,
        []
      );
      const columns = (await db.query(`
        select attname from pg_attribute
        where attrelid = 'public.provider_credentials'::regclass and attnum > 0 and not attisdropped
        order by attnum
      `)).rows.map((row) => row.attname).filter((name) => name !== "encrypted_secret").join(", ");

      for (const [role, userId] of [["anon", null], ...users.map((id) => ["authenticated", id])]) {
        await asRole(role, userId, async () => {
          for (const name of ["handle_new_auth_user", ...(withAutoEnable ? ["rls_auto_enable"] : [])]) {
            const result = await db.query("select has_function_privilege(current_user, $1, 'EXECUTE') as allowed", [`public.${name}()`]);
            assert.equal(result.rows[0].allowed, false);
            await denied(`select public.${name}()`);
          }
          await assert.rejects(db.query("select * from public.workspace_usage_summary"), { code: "42P01" });
          await denied("select encrypted_secret from public.provider_credentials");
          await denied("select * from public.provider_credentials");
          await denied("update public.provider_credentials set status = 'valid' where user_id = $1", [userId ?? users[0]]);
          await denied("update public.provider_credentials set monthly_token_cap = null, encrypted_secret = 'forged' where user_id = $1", [userId ?? users[0]]);
          await denied(`
            insert into public.provider_credentials (user_id, provider, label, encrypted_secret, secret_mask, status)
            values ($1, 'openai', 'Forged key', 'forged', 'masked', 'valid')
          `, [userId ?? users[0]]);
          await denied(`
            insert into public.usage_events (user_id, provider, model, total_tokens, estimated_cost_usd)
            values ($1, 'openai', 'forged-model', 1, 0)
          `, [userId ?? users[0]]);

          if (role === "authenticated") {
            const credentials = await db.query(`select ${columns} from public.provider_credentials`);
            assert.equal(credentials.rows.length, 1);
            assert.equal(credentials.rows[0].user_id, userId);
            assert.equal(credentials.rows[0].status, "pending");
            assert.equal("encrypted_secret" in credentials.rows[0], false);
            assert.deepEqual((await db.query(`select ${columns} from public.provider_credentials where user_id <> $1`, [userId])).rows, []);
          } else {
            await denied(`select ${columns} from public.provider_credentials`);
          }
          for (const table of ["profiles", "usage_events"]) {
            const rows = (await db.query(`select * from public.${table}`)).rows;
            assert.equal(rows.length, userId ? 1 : 0);
            if (userId) assert.equal(rows[0].user_id, userId);
          }
        });
      }

      await asRole("service_role", null, async () => {
        assert.equal((await db.query("select encrypted_secret from public.provider_credentials")).rows.length, 2);
        await db.transaction(async (tx) => {
          const updated = await tx.query("update public.provider_credentials set status = 'valid' returning id");
          assert.equal(updated.rows.length, 2);
          const inserted = await tx.query(`
            insert into public.provider_credentials (user_id, provider, label, encrypted_secret, secret_mask)
            values ($1, 'gemini', 'Service key', 'service-ciphertext', 'masked') returning id
          `, [users[0]]);
          await tx.query(`
            insert into public.usage_events (user_id, credential_id, provider, model, total_tokens)
            values ($1, $2, 'gemini', 'service-model', 10)
          `, [users[0], inserted.rows[0].id]);
          await tx.rollback();
        });
      });
    }

    async function snapshot() {
      const result = {};
      for (const table of ["profiles", "provider_credentials", "managed_api_keys", "conversations", "messages", "usage_events", "sso_handoffs"]) {
        result[table] = (await db.query(`select * from public.${table} order by 1`)).rows;
      }
      result.policies = (await db.query("select * from pg_policies where schemaname = 'public' order by tablename, policyname")).rows;
      result.grants = (await db.query(`
        select table_name, column_name, grantee, privilege_type
        from information_schema.column_privileges where table_schema = 'public'
        order by table_name, column_name, grantee, privilege_type
      `)).rows;
      result.functions = (await db.query(`
        select proname, proacl::text from pg_proc
        where pronamespace = 'public'::regnamespace and proname in ('handle_new_auth_user', 'rls_auto_enable')
        order by proname
      `)).rows;
      return result;
    }

    try {
      // Supabase supplies auth, API roles, and permissive default public grants.
      await db.exec(`
        create role anon nologin;
        create role authenticated nologin;
        create role service_role nologin bypassrls;
        create schema auth;
        create table auth.users (
          id uuid primary key, email text,
          raw_user_meta_data jsonb not null default '{}',
          raw_app_meta_data jsonb not null default '{}'
        );
        create function auth.uid() returns uuid language sql stable as $$
          select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
        $$;
        grant usage on schema public, auth to anon, authenticated, service_role;
        alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
        alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
        alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
      `);
      if (withAutoEnable) {
        await db.exec(`
          create function public.rls_auto_enable() returns event_trigger
          language plpgsql security definer as $$ begin return; end; $$;
        `);
      }
      await db.exec(migrations[0]);
      for (const [index, userId] of users.entries()) {
        await db.query("insert into auth.users (id, email) values ($1, $2)", [userId, `member${index}@example.test`]);
        await asRole("service_role", null, async () => {
          const result = await db.query(`
            insert into public.provider_credentials (user_id, provider, label, encrypted_secret, secret_mask)
            values ($1, 'openai', 'Owner key', 'owner-ciphertext', 'masked') returning id
          `, [userId]);
          await db.query(`
            insert into public.usage_events (user_id, credential_id, provider, model, total_tokens)
            values ($1, $2, 'openai', 'test-model', 20)
          `, [userId, result.rows[0].id]);
        });
      }
      await asRole("authenticated", users[0], async () => {
        assert.equal((await db.query("select * from public.workspace_usage_summary")).rows.length, 2);
        assert.equal((await db.query("select encrypted_secret from public.provider_credentials")).rows.length, 1);
        assert.equal((await db.query("select has_function_privilege(current_user, 'public.handle_new_auth_user()', 'EXECUTE') as allowed")).rows[0].allowed, true);
      });
      await db.exec(migrations[1]);
      await probeLockdown();
      const locked = await snapshot();
      await db.exec(migrations[1]);
      assert.deepEqual(await snapshot(), locked);
      for (const migration of migrations) await db.exec(migration);
      assert.deepEqual(await snapshot(), locked);
      await probeLockdown();
      // Revoking direct execution must leave the auth trigger functional.
      await db.query("insert into auth.users (id) values ($1)", ["00000000-0000-0000-0000-000000000003"]);
      assert.equal((await db.query("select * from public.profiles")).rows.length, 3);
    } finally {
      await db.close();
    }
  });
}
