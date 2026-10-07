-- Run this in the Supabase SQL Editor AFTER deploying the code that adds
-- submitRsvp (app/i/[slug]/actions.ts). Before that deploy, guest pages
-- still insert RSVPs directly with the publishable key, and this would
-- break them.
--
-- "anyone can rsvp" (schema.sql) let anyone holding the publishable key —
-- which shipped in the browser bundle — insert any row for any invite
-- (drafts included) with any guest_count, message or created_at. RSVPs now
-- go through the submitRsvp Server Action, which validates and inserts with
-- the service-role client, so the public roles need no access at all.

drop policy if exists "anyone can rsvp" on rsvps;
revoke all on table rsvps from anon, authenticated;

-- Backstops for the same limits submitRsvp enforces, in case anything ever
-- writes here without going through it. NOT VALID: applies to new and
-- updated rows only, so any odd row already saved doesn't block this.
alter table rsvps drop constraint if exists rsvps_guest_count_range;
alter table rsvps add constraint rsvps_guest_count_range
  check (guest_count between 0 and 20) not valid;

alter table rsvps drop constraint if exists rsvps_guest_name_length;
alter table rsvps add constraint rsvps_guest_name_length
  check (char_length(guest_name) between 1 and 100) not valid;

alter table rsvps drop constraint if exists rsvps_message_length;
alter table rsvps add constraint rsvps_message_length
  check (message is null or char_length(message) <= 1000) not valid;

-- Check: this should return no rows for the rsvps table.
select policyname, roles, cmd from pg_policies where tablename = 'rsvps';
