-- Run this AFTER seed-birthday-cream-pink-template.sql, in the SQL
-- Editor, to create one test invite so you can view the Cream & Pink
-- Birthday template locally at http://localhost:3000/i/rebecca-cream-pink

-- Unlike the Disco Birthday demo, this template's demo photos are safe
-- to include here: they're free stock photos (not derived from a Canva
-- template export), so there's no licensing question blocking their use
-- as sample content the way there was for birthday-disco's demo photo.
insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  whatsapp_number, photo_urls, status
)
select
  'rebecca-cream-pink',
  id,
  'Rebecca',
  '2030-09-20 17:00:00+03',
  'Eateria 27, 2507 Snowbird Lane, Bellevue, NE 68005',
  'https://maps.google.com/?q=2507+Snowbird+Lane+Bellevue+NE',
  '96170664401',
  array[
    '/templates/birthday-cream-pink/demo-1-hero.jpg',
    '/templates/birthday-cream-pink/demo-2-when-where.jpg',
    '/templates/birthday-cream-pink/demo-3-snacks.jpg',
    '/templates/birthday-cream-pink/demo-4-garden.jpg',
    '/templates/birthday-cream-pink/demo-5-dancing.jpg',
    '/templates/birthday-cream-pink/demo-6-contact.jpg'
  ],
  'live'
from templates where slug = 'birthday-cream-pink'
on conflict (slug) do nothing;
