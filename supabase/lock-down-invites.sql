-- Run this in the Supabase SQL Editor.
-- Closes public (anon-key) read access to the invites table.
--
-- schema.sql created "public read live invites" back when invites only held
-- guest-facing fields. add-payment-fields.sql later added owner_email and
-- dashboard_token to the same table, and that policy exposes every column —
-- so anyone holding the publishable key (it ships in the browser bundle) could
-- list every live invite's dashboard link and owner email straight from the
-- REST API.
--
-- Nothing in the app needs this policy: every page reads invites server-side
-- through getSupabaseAdmin() (service role, bypasses RLS). The browser only
-- ever inserts into rsvps, and that foreign-key check doesn't need read access
-- to invites.

drop policy if exists "public read live invites" on invites;

-- Defense in depth: even if a permissive policy is re-added by mistake later,
-- the anon/authenticated roles have no table privileges to use it with.
revoke all on table invites from anon, authenticated;

-- Check: this should return no rows for the invites table.
select policyname, roles, cmd from pg_policies where tablename = 'invites';
