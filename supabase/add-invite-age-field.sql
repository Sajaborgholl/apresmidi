-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run
--
-- Adds the "age" field used by the Disco Birthday template's hero (the big
-- balloon-style number) — optional, so templates that don't use it (every
-- non-birthday template) just leave it null.

alter table invites add column if not exists age integer;
