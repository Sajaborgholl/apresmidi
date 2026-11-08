-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the "Sweet Pea" wedding template and a demo invite you can view
-- at /i/ghina-malek.

insert into templates (slug, name, category, source)
values ('wedding-sweet-pea', 'Sweet Pea Wedding', 'wedding', 'static')
on conflict (slug) do nothing;

insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  photo_urls, status, is_demo
)
select
  'ghina-malek',
  id,
  'Ghina & Malek',
  '2027-08-08 20:00:00+00',
  '123 Anywhere Street',
  'https://maps.google.com/?q=123+Anywhere+Street',
  array[]::text[],
  'live',
  true
from templates where slug = 'wedding-sweet-pea'
on conflict (slug) do nothing;
