-- Run this in the Supabase SQL Editor.
-- Adds the columns needed for payment confirmation + the owner dashboard,
-- and tightens the rsvps RLS policy that (despite its name) actually let
-- ANY anon-key client read every RSVP for every invite.

alter table invites add column if not exists owner_email text;
alter table invites add column if not exists dashboard_token text unique;
alter table invites add column if not exists paid_at timestamptz;

-- The new /dashboard/[token] route reads rsvps server-side via
-- getSupabaseAdmin() (service-role, bypasses RLS entirely), so anon
-- clients need zero read access to rsvps going forward. This policy's
-- USING clause was `true` regardless of its name — drop it outright
-- rather than trying to "scope" it, since nothing legitimate needs it.
drop policy if exists "public read rsvps for their invite" on rsvps;

-- Unchanged, left in place intentionally: guests still insert their own
-- RSVP directly from the browser with the anon key.
-- create policy "anyone can rsvp" on rsvps for insert with check (true);
