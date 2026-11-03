-- Run this in the Supabase SQL Editor BEFORE deploying the code that sends
-- invitations on WhatsApp (lib/whatsappQueue.ts). Needs add-guest-list.sql
-- first. Safe to run more than once.
--
-- Every WhatsApp message we send (invitations, reminders, forwarded guest
-- replies) is a row here. Hosts queue them from the dashboard; a worker
-- (app/api/whatsapp/worker, called every minute by add-whatsapp-worker-cron.sql)
-- sends them one by one through Kapso (WhatsApp's official API); its webhook
-- (app/api/whatsapp/webhook) updates their status (delivered, read).

create table if not exists guest_messages (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references invites(id) on delete cascade,
  -- Null for forwards to the host (guest_id then says who wrote).
  guest_id uuid references guests(id) on delete set null,
  kind text not null,
  to_phone text not null,
  body text not null,
  status text not null default 'queued',
  -- WhatsApp's id for the sent message ("wamid…"), to match webhooks.
  wa_msg_id text,
  error text,
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint guest_messages_kind check (kind in ('invite', 'reminder', 'forward')),
  constraint guest_messages_status check (status in ('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
  constraint guest_messages_phone check (to_phone ~ '^[0-9]{7,15}$'),
  constraint guest_messages_body_length check (char_length(body) between 1 and 4000)
);

create index if not exists guest_messages_due on guest_messages (next_attempt_at) where status = 'queued';
create index if not exists guest_messages_guest on guest_messages (guest_id, created_at desc);
create index if not exists guest_messages_invite on guest_messages (invite_id, created_at desc);
create index if not exists guest_messages_wa_msg_id on guest_messages (wa_msg_id) where wa_msg_id is not null;
create index if not exists guest_messages_to_phone on guest_messages (to_phone, created_at desc);

alter table guest_messages enable row level security;
revoke all on table guest_messages from anon, authenticated;

-- Hands the worker the next due messages and marks them 'sending' in one
-- step. "skip locked" means two workers running at once never get the same
-- message, so nobody is messaged twice. Messages stuck in 'sending' for more
-- than 5 minutes (a worker that died mid-send) are taken again.
create or replace function claim_guest_messages(p_limit int)
returns setof guest_messages
language sql
security definer
set search_path = public
as $$
  update guest_messages m
     set status = 'sending', attempts = m.attempts + 1, updated_at = now()
   where m.id in (
     select id from guest_messages
      where (status = 'queued' and next_attempt_at <= now())
         or (status = 'sending' and updated_at < now() - interval '5 minutes')
      order by next_attempt_at, created_at
      limit p_limit
      for update skip locked
   )
  returning m.*;
$$;
revoke all on function claim_guest_messages(int) from public, anon, authenticated;

-- One row: where sending stands ("ok", or "paused_…" when Kapso refuses
-- sends until the account is fixed). The dashboard shows "sending paused".
create table if not exists whatsapp_status (
  id int primary key default 1,
  status text not null default 'unknown',
  updated_at timestamptz not null default now(),
  constraint whatsapp_status_one_row check (id = 1)
);
insert into whatsapp_status (id) values (1) on conflict (id) do nothing;
alter table whatsapp_status enable row level security;
revoke all on table whatsapp_status from anon, authenticated;

-- Only one worker sends at a time (the every-minute job and a "Send" press can
-- overlap), so messages keep their ~5 second spacing. A worker takes the lease
-- for its run; if it dies, the lease simply expires.
alter table whatsapp_status add column if not exists worker_until timestamptz;

create or replace function take_whatsapp_worker_lease(p_seconds int)
returns boolean
language sql
security definer
set search_path = public
as $$
  update whatsapp_status
     set worker_until = now() + make_interval(secs => p_seconds)
   where id = 1 and (worker_until is null or worker_until < now())
  returning true;
$$;

create or replace function release_whatsapp_worker_lease()
returns void
language sql
security definer
set search_path = public
as $$
  update whatsapp_status set worker_until = null where id = 1;
$$;
revoke all on function take_whatsapp_worker_lease(int) from public, anon, authenticated;
revoke all on function release_whatsapp_worker_lease() from public, anon, authenticated;

-- Check: both tables listed with RLS on.
select relname, relrowsecurity from pg_class where relname in ('guest_messages', 'whatsapp_status');
