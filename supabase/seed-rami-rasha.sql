-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the new scrapbook template and creates the real Rami & Rasha invite.

insert into templates (slug, name, category, source)
values ('wedding-scrapbook', 'Scrapbook Wedding', 'wedding', 'static')
on conflict (slug) do nothing;

-- Note: photo_urls[0] should be a URL Next.js can load the image from.
-- Easiest options:
--   1) Upload rami-rasha-childhood.jpg to Supabase Storage, use its public URL, or
--   2) Commit the image into your Next.js app's /public folder and use a relative
--      path like '/rami-rasha-childhood.jpg' (works since it's served by your own site).

insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  photo_urls, status
)the 
select
  'rami-rasha',
  id,
  'Rami & Rasha',
  '2026-08-25 20:00:00+03',
  'Em Sherif Rooftop, Beirut',
  null,
  array['/rami-rasha-childhood.jpg'],
  'live'
from templates where slug = 'wedding-scrapbook';
