-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the new "Cream & Pink Birthday" template so it shows up in
-- the birthday category gallery and can be ordered like the other
-- templates.

insert into templates (slug, name, category, source)
values ('birthday-cream-pink', 'Cream & Pink Birthday', 'birthday', 'static')
on conflict (slug) do nothing;
