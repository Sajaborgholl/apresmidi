-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the new "Disco Birthday" template so it shows up in the
-- birthday category gallery and can be ordered like the other templates.

insert into templates (slug, name, category, source)
values ('birthday-disco', 'Disco Birthday', 'birthday', 'static')
on conflict (slug) do nothing;
