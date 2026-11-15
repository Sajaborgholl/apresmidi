-- Run once in the Supabase SQL editor BEFORE deploying the code that uses it
-- (and before testing locally: the local app uses the same database).
-- Safe to run twice.

-- Optional words the host writes on their invitation (shown only by the
-- designs that have a place for them; see lib/templates/registry.ts):
--   dress_code     e.g. "Cocktail attire"
--   guest_message  a few sentences to the guests
--   highlights     Cream & Pink's three "What to expect" captions
-- And the reply deadline the host sets on the dashboard (replies close after
-- that day).
alter table invites add column if not exists dress_code text;
alter table invites add column if not exists guest_message text;
alter table invites add column if not exists highlights text[];
alter table invites add column if not exists reply_by date;

-- The 6-digit email codes asked for before payment (app/order/[slug]/
-- emailActions.ts). Only the hash of a code is stored. Server-only, like
-- every other table here: no access for anon/authenticated.
create table if not exists email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz,
  used_at timestamptz
);
create index if not exists email_verifications_email on email_verifications (lower(email), created_at desc);
alter table email_verifications enable row level security;
revoke all on table email_verifications from anon, authenticated;
