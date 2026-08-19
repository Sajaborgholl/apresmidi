-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run
--
-- Stores leads from the "Get Premium" form on the homepage pricing section
-- (name/email/phone) so the team can follow up within 48 hours.

create table if not exists premium_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  contacted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table premium_inquiries enable row level security;
-- No policies added on purpose: this table is only ever written to via
-- submitPremiumInquiry (app/_actions/premium-inquiry.ts), a Server Action
-- using the service-role admin client — same as createOrder and
-- confirmInvitePayment already do. No anon-key access is needed at all,
-- so there's nothing to lock down after the fact.
