-- Run this AFTER seed-birthday-disco-template.sql, in the SQL Editor, to
-- create one test invite so you can view the Disco Birthday template
-- locally at http://localhost:3000/i/olivia-disco

-- No photo_urls set — this shows the "No photo yet" placeholder in the
-- hero photo frame, which is expected until a real photo is added.
-- Deliberately NOT using public/olivia-birthday-disco.png here: its
-- embedded metadata identifies it as a Canva template export, and reusing
-- a Canva-designed composition as a product asset is a licensing question
-- worth resolving before using it anywhere real (see the note in
-- BirthdayDisco.tsx).
insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  whatsapp_number, age, status
)
select
  'olivia-disco',
  id,
  'Olivia',
  '2030-11-10 19:00:00+03',
  '123 Anywhere Street, Any City',
  'https://maps.google.com/?q=123+Anywhere+Street',
  '96170664401',
  21,
  'live'
from templates where slug = 'birthday-disco'
on conflict (slug) do nothing;
