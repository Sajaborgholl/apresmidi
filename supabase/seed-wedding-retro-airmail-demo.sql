-- Run this AFTER seed-wedding-retro-airmail-template.sql, in the SQL Editor,
-- to create one invite so you can view the Retro Airmail template at
-- http://localhost:3000/i/jad-mariana

insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  photo_urls, status
)
select
  'jad-mariana',
  id,
  'Jad & Mariana',
  '2027-08-17 18:00:00+00',
  '123 Anywhere Street, Any City',
  'https://maps.google.com/?q=123+Anywhere+Street',
  array[
    '/templates/wedding-retro-airmail/demo-photo-1.jpg',
    '/templates/wedding-retro-airmail/demo-photo-2.jpg'
  ],
  'live'
from templates where slug = 'wedding-retro-airmail'
on conflict (slug) do nothing;

-- Photos: the couple from the Canva design — 1 in the envelope, 2 (the
-- cut-out with the pixel sunglasses) in the frame beside the letter.
