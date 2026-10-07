-- Run this in the Supabase SQL Editor BEFORE deploying the code that uses it
-- (createOrder writes this column, so orders fail until it exists).
--
-- A private reference for the order confirmation page, separate from the
-- invite slug. The slug is the public guest link, so the confirmation page
-- used to hand the dashboard link to anyone who swapped it into
-- /order/<template>/confirmation?invite=<slug>. The confirmation page now
-- only reveals the dashboard link to whoever holds this token, which only
-- ever appears in the customer's own post-checkout URL.
--
-- Existing invites keep order_token = null: their confirmation page still
-- works by slug, but never shows the dashboard link (it was emailed).

alter table invites add column if not exists order_token uuid unique;
