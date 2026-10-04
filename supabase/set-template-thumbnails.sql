-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run
--
-- Points each template at its screenshot in public/thumbnails/, so the
-- homepage "Browse by occasion" cards and the category pages show a still
-- image instead of a live preview. Safe to re-run.
--
-- wedding-scrapbook is left out on purpose and keeps its live preview
-- until it has a screenshot.

update templates set thumbnail_url = '/thumbnails/wedding-blush-bow.webp'       where slug = 'wedding-blush-bow';
update templates set thumbnail_url = '/thumbnails/wedding-classic.webp'         where slug = 'wedding-classic';
update templates set thumbnail_url = '/thumbnails/birthday-disco.webp'          where slug = 'birthday-disco';
update templates set thumbnail_url = '/thumbnails/birthday-cream-pink.webp'     where slug = 'birthday-cream-pink';
update templates set thumbnail_url = '/thumbnails/birthday-retro-polaroid.webp' where slug = 'birthday-retro-polaroid';
update templates set thumbnail_url = '/thumbnails/bachelorette-coastal.webp'    where slug = 'bachelorette-coastal';
update templates set thumbnail_url = '/thumbnails/bachelorette-martini.webp'    where slug = 'bachelorette-martini';
update templates set thumbnail_url = '/thumbnails/bachelorette-doodle.webp'     where slug = 'bachelorette-doodle';
