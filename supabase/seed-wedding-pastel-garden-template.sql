-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the "Pastel Garden" wedding template so it shows up in the
-- wedding category gallery and can be ordered like the other templates.

insert into templates (slug, name, category, source)
values ('wedding-pastel-garden', 'Pastel Garden Wedding', 'wedding', 'static')
on conflict (slug) do nothing;
