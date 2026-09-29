-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run
--
-- The homepage now has three plans. Plus and Premium both collect a request
-- through the same form (app/_components/PlanRequestDialog.tsx), so each
-- lead records which plan it came from, the add-ons picked (Plus only) and
-- the customer's optional notes.
-- Additive only: existing rows keep working and read as null.

alter table premium_inquiries
  add column if not exists plan text,
  add column if not exists addons text[],
  add column if not exists notes text;
