// Seeds (or removes) the confirmed test account used by the auth E2E specs.
//   node scripts/e2e-seed.mjs up|down
// Reads SUPABASE_DB_PASSWORD from .env.local; connects via the session pooler.
import { readFileSync } from "node:fs";
import pg from "pg";

const REF = "ruzamxdsuddjjuqmxokf";
export const E2E_EMAIL = "e2e-smoke@example.com";
const E2E_PASSWORD = "E2eSmokeTest1234";
const E2E_INVITE = "b2bb2g-e2e-invitation-token-20260712";

const password = readFileSync(".env.local", "utf8")
  .split("\n")
  .find((line) => line.startsWith("SUPABASE_DB_PASSWORD="))
  ?.slice("SUPABASE_DB_PASSWORD=".length)
  .trim();
if (!password) {
  console.error("SUPABASE_DB_PASSWORD missing in .env.local");
  process.exit(1);
}

const client = new pg.Client({
  host: "aws-1-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  user: `postgres.${REF}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

const mode = process.argv[2] ?? "up";
await client.connect();
try {
  if (mode === "down") {
    await client.query(
      "delete from public.referral_invitations where token_hash = encode(digest($1, 'sha256'), 'hex')",
      [E2E_INVITE]
    );
    await client.query("delete from auth.users where email = $1", [E2E_EMAIL]);
    console.log("e2e user removed");
  } else {
    await client.query(
      "delete from public.referral_invitations where token_hash = encode(digest($1, 'sha256'), 'hex')",
      [E2E_INVITE]
    );
    await client.query("delete from auth.users where email = $1", [E2E_EMAIL]);
    await client.query(
      `insert into public.referral_invitations (inviter_id, token_hash, status, expires_at)
       select id, encode(digest($1, 'sha256'), 'hex'), 'active', now() + interval '1 hour'
       from public.profiles where status = 'active'
       order by is_admin desc, created_at limit 1`,
      [E2E_INVITE]
    );
    await client.query(
      `insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, recovery_token, email_change, email_change_token_new
       ) values (
         '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
         'authenticated', $1, crypt($2, gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}', jsonb_build_object('invite_token', $3::text), now(), now(), '', '', '', ''
       )`,
      [E2E_EMAIL, E2E_PASSWORD, E2E_INVITE]
    );
    await client.query(
      `insert into auth.identities (
         id, user_id, identity_data, provider, provider_id,
         last_sign_in_at, created_at, updated_at
       )
       select gen_random_uuid(), u.id,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', u.id::text, now(), now(), now()
       from auth.users u where u.email = $1`,
      [E2E_EMAIL]
    );
    console.log("e2e user seeded");
  }
} finally {
  await client.end();
}
