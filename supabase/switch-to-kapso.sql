-- Run this in the Supabase SQL Editor BEFORE deploying the code that sends
-- through Kapso (lib/kapso.ts). Needs add-whatsapp-messages.sql first. Safe
-- to run more than once.
--
-- WhatsApp's official API (through Kapso) only lets a business start a
-- conversation with a Meta-approved template, so each queued message now
-- carries the template to use and its variables. `body` stays as the
-- readable copy shown in the dashboard.

alter table guest_messages add column if not exists template_name text;
alter table guest_messages add column if not exists template_language text;
alter table guest_messages add column if not exists template_params jsonb;
alter table guest_messages add column if not exists button_suffix text;

-- Anything still queued from the WASenderAPI days has no template: stop it
-- rather than sending it some other way. Hosts can press Send again.
update guest_messages
   set status = 'cancelled', error = 'Replaced by the Kapso sending (send again)', updated_at = now()
 where status in ('queued', 'sending') and template_name is null;

-- Check: the four new columns are listed.
select column_name from information_schema.columns
 where table_name = 'guest_messages' and column_name in ('template_name', 'template_language', 'template_params', 'button_suffix');
