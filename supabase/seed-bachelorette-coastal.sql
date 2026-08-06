-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the new Coastal Bachelorette template (and its category, if it
-- doesn't exist yet) and creates Israa's real invite.

-- If you already have a "bachelorette" category, this is skipped safely.
-- Adjust the price to whatever you actually want to charge for this category.
insert into categories (slug, name, price)
values ('bachelorette', 'Bachelorette', 25)
on conflict (slug) do nothing;

insert into templates (slug, name, category, source)
values ('bachelorette-coastal', 'Coastal Bachelorette', 'bachelorette', 'static')
on conflict (slug) do nothing;

-- Israa's real invite.
-- Assumed 9:30 PM (evening) since only "9:30" was given — change the time
-- below if you meant morning.
insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  photo_urls, status
)
select
  'israa-bachelorette',
  id,
  'Israa',
  '2026-08-16 21:30:00+03',
  'Merchak Rooftop, Beirut',
  null,
  null,
  'live'
from templates where slug = 'bachelorette-coastal'
on conflict (slug) do nothing;
