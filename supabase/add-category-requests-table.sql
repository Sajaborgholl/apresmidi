-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run
--
-- Stores leads from the "suggest a category" form on the homepage, right
-- after "Browse by occasion" (name/email/desired category) so the team can
-- follow up on new occasion ideas (graduation, private party, etc).

create table if not exists category_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  category text not null,
  contacted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table category_requests enable row level security;
-- No policies added on purpose: this table is only ever written to via
-- submitCategoryRequest (app/_actions/category-request.ts), a Server Action
-- using the service-role admin client — same as submitPremiumInquiry
-- already does. No anon-key access is needed at all, so there's nothing to
-- lock down after the fact.
