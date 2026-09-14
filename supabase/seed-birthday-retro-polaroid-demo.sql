-- Run this AFTER seed-birthday-retro-polaroid-template.sql, in the SQL
-- Editor, to create one test invite so you can view the Retro Polaroid
-- Birthday template locally at http://localhost:3000/i/avery-retro-polaroid

-- Uses the source design's own stock photo ("Woman Drinking Champagne")
-- as the demo photo. Checked its licensing in the source's own bootstrap
-- JSON before reusing it: "licensing":"FREE" (unlike the polaroid frame
-- and washi-tape assets, which are "STANDARD"/paid) — a genuinely free
-- stock photo is fine to use as demo content, same reasoning as
-- birthday-cream-pink's demo photos. (birthday-disco's demo deliberately
-- omits its photo for the opposite reason: that one wasn't confirmed
-- free.) Saved locally as public/templates/birthday-retro-polaroid/demo-photo.jpg.
insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  whatsapp_number, photo_urls, status
)
select
  'avery-retro-polaroid',
  id,
  'Avery',
  '2030-01-29 21:00:00+03',
  '123 Anywhere St., Any City',
  'https://maps.google.com/?q=123+Anywhere+St',
  '96170664401',
  array['/templates/birthday-retro-polaroid/demo-photo.jpg'],
  'live'
from templates where slug = 'birthday-retro-polaroid'
on conflict (slug) do nothing;
