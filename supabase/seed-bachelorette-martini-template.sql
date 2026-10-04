-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the Martini Bachelorette template. The "bachelorette" category
-- already exists (created by seed-bachelorette-coastal.sql).

insert into templates (slug, name, category, source)
values ('bachelorette-martini', 'Martini Bachelorette', 'bachelorette', 'static')
on conflict (slug) do nothing;
