-- Run this in the Supabase SQL Editor AFTER deploying the WhatsApp sending
-- code, once your site is live on its real address. Replace the two values
-- marked below first.
--
-- Vercel's free (Hobby) plan can't run a job every minute, so Supabase does:
-- pg_cron calls our worker (app/api/whatsapp/worker) once a minute through
-- pg_net, and the worker sends the next ~9 queued WhatsApp messages. The
-- dashboard also wakes the worker right away when a host presses Send, so the
-- first messages don't wait for the next minute.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Store the worker's address and secret in Supabase Vault (encrypted).
--    The secret must equal WHATSAPP_WORKER_SECRET in Vercel.
--    Run these two lines once (to change a value later: vault.update_secret).
select vault.create_secret('https://YOUR-DOMAIN/api/whatsapp/worker', 'whatsapp_worker_url');   -- <- your domain
select vault.create_secret('PASTE-THE-WHATSAPP_WORKER_SECRET-HERE', 'whatsapp_worker_secret'); -- <- the secret

-- 2. Every minute, POST to the worker with the secret.
select cron.unschedule('whatsapp-worker') where exists (select 1 from cron.job where jobname = 'whatsapp-worker');
select cron.schedule(
  'whatsapp-worker',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'whatsapp_worker_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'whatsapp_worker_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Check: the job is listed; after a minute or two, recent runs show here.
select jobid, jobname, schedule, active from cron.job where jobname = 'whatsapp-worker';
-- select status_code, created from net._http_response order by created desc limit 5;
