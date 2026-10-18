-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the "Retro Airmail" wedding template so it shows up in the
-- wedding category gallery and can be ordered like the other templates.

insert into templates (slug, name, category, source)
values ('wedding-retro-airmail', 'Retro Airmail Wedding', 'wedding', 'static')
on conflict (slug) do nothing;
