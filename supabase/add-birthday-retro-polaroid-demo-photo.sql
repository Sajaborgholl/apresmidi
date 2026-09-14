-- Run this in the Supabase SQL Editor if you already ran
-- seed-birthday-retro-polaroid-demo.sql before this photo was added to
-- it — "on conflict (slug) do nothing" means re-running that file won't
-- update your existing row, so this one-off UPDATE adds the photo to it
-- directly. Not needed for a fresh run of the seed file (it already
-- includes this photo now).

update invites
set photo_urls = array['/templates/birthday-retro-polaroid/demo-photo.jpg']
where slug = 'avery-retro-polaroid';
