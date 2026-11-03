-- Run this in the Supabase SQL Editor BEFORE deploying the code that adds
-- guest lists (personal invitation links, app/i/[slug]/g/[token]). Safe to
-- run more than once.
--
-- Hosts add named guests in their dashboard; each guest gets a private link
-- (/i/<slug>/g/<token>) that shows their name and the seats reserved for
-- them, and their RSVP is tied to them: one reply per guest, which they can
-- edit, and never more people than their seats.

-- ---------------------------------------------------------------- guests
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references invites(id) on delete cascade,
  name text not null,
  -- Digits only, country code first (e.g. 96170123456) — the same form as
  -- invites.whatsapp_number and what WhatsApp needs.
  phone text not null,
  seats int not null default 1,
  -- The secret in the guest's personal link: 128 random bits, URL-safe.
  token text not null unique,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count int not null default 0,
  created_at timestamptz not null default now(),
  constraint guests_name_length check (char_length(name) between 1 and 100),
  constraint guests_phone_digits check (phone ~ '^[0-9]{7,15}$'),
  -- Keep in step with MAX_SEATS_PER_GUEST in lib/guestRules.ts.
  constraint guests_seats_range check (seats between 1 and 10),
  constraint guests_invite_phone unique (invite_id, phone)
);

create index if not exists guests_invite_id on guests (invite_id, created_at);

-- Same posture as invites/rsvps: only the server (service role) touches it.
alter table guests enable row level security;
revoke all on table guests from anon, authenticated;

-- ---------------------------------------------------------------- rsvps
-- One reply per guest, updated when they change it.
alter table rsvps add column if not exists guest_id uuid references guests(id) on delete set null;
alter table rsvps add column if not exists updated_at timestamptz;
create unique index if not exists rsvps_guest_id_unique on rsvps (guest_id) where guest_id is not null;

-- Counts one open of a guest's personal link, atomically (two tabs opening
-- at once both count). Called by the markGuestOpened server action.
create or replace function record_guest_open(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update guests
     set open_count = open_count + 1,
         first_opened_at = coalesce(first_opened_at, now()),
         last_opened_at = now()
   where token = p_token;
$$;
revoke all on function record_guest_open(text) from public, anon, authenticated;

-- --------------------------------------------------------------- invites
-- Language of the WhatsApp messages sent to guests (chosen in the dashboard).
alter table invites add column if not exists message_language text not null default 'en';
alter table invites drop constraint if exists invites_message_language;
alter table invites add constraint invites_message_language check (message_language in ('en', 'ar', 'both'));

-- When the host confirmed their guests expect the invitation (asked before
-- the first WhatsApp send).
alter table invites add column if not exists send_consent_at timestamptz;

-- Check: should list the new table with RLS on, and no policies on it.
select relname, relrowsecurity from pg_class where relname = 'guests';
select policyname from pg_policies where tablename = 'guests';
