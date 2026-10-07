-- Run this in the Supabase SQL Editor. Safe to run before or after deploying:
-- until it exists, lib/rateLimit.ts logs a warning and lets requests through.
--
-- Backs lib/rateLimit.ts. Rate limits have to be counted somewhere every
-- server instance shares (Vercel runs many), so each allowed request leaves
-- one row here, keyed by "<action>:<hashed client IP>" — no raw IPs stored.

create table if not exists rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_key_created_at on rate_limit_hits (key, created_at);

alter table rate_limit_hits enable row level security;
revoke all on table rate_limit_hits from anon, authenticated;

-- Returns true (and records the hit) if `p_key` has had fewer than `p_limit`
-- hits in the last `p_window_seconds`; false otherwise. The advisory lock
-- makes count-then-insert atomic per key, so a burst of parallel requests
-- can't all slip under the limit together.
create or replace function check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hits int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));

  select count(*) into hits
  from rate_limit_hits
  where key = p_key
    and created_at > now() - make_interval(secs => p_window_seconds);

  if hits >= p_limit then
    return false;
  end if;

  insert into rate_limit_hits (key) values (p_key);

  -- Housekeeping, on ~1% of calls: no window is longer than a day.
  if random() < 0.01 then
    delete from rate_limit_hits where created_at < now() - interval '1 day';
  end if;

  return true;
end;
$$;

-- Only the server (service role) may call it.
revoke all on function check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, int) to service_role;
