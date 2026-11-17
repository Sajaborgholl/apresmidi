-- Run this AFTER seed-wedding-pastel-garden-template.sql, in the SQL Editor,
-- to create one invite so you can view the Pastel Garden template at
-- http://localhost:3000/i/ghina-malek

insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  photo_urls, status
)
select
  'ghina-malek',
  id,
  'Ghina & Malek',
  '2027-08-08 20:00:00+00',
  '123 Anywhere Street',
  'https://www.google.com/maps/search/?api=1&query=123+Anywhere+Street',
  array[]::text[],
  'live'
from templates where slug = 'wedding-pastel-garden'
on conflict (slug) do nothing;

-- No photos: this template doesn't use any.
