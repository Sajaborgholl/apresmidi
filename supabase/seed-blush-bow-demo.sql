-- Run this AFTER seed-blush-bow-template.sql, in the SQL Editor, to create
-- one test invite so you can view the Blush Bow template locally at
-- http://localhost:3000/i/peyton-shane

insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  whatsapp_number, status
)
select
  'peyton-shane',
  id,
  'Peyton & Shane',
  '2030-01-20 18:00:00+03',
  null,
  null,
  '96170664401',
  'live'
from templates where slug = 'wedding-blush-bow'
on conflict (slug) do nothing;

-- No photo_urls set, so both photo frames will show the "No photo yet"
-- placeholder — that's expected until you add real photos.
