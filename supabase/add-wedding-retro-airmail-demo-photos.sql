-- Run this in the Supabase SQL Editor if you already ran
-- seed-wedding-retro-airmail-demo.sql before the photos were added to it —
-- "on conflict (slug) do nothing" means re-running that file won't update
-- your existing row, so this one-off UPDATE adds the photos directly. Not
-- needed for a fresh run of the seed file (it includes them now).

update invites
set photo_urls = array[
  '/templates/wedding-retro-airmail/demo-photo-1.jpg',
  '/templates/wedding-retro-airmail/demo-photo-2.jpg'
]
where slug = 'jad-mariana';
