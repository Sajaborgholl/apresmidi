-- Run this in the Supabase SQL Editor BEFORE deploying the carousel code
-- change that reads this column — otherwise any query selecting
-- `video_url` will error since the column won't exist yet.

alter table templates add column if not exists video_url text;

-- Once you've uploaded video files (see below for where/how they're
-- named), point each template at its file like this:
-- update templates set video_url = '/videos/wedding-classic.mp4' where slug = 'wedding-classic';
-- update templates set video_url = '/videos/wedding-scrapbook.mp4' where slug = 'wedding-scrapbook';
-- update templates set video_url = '/videos/wedding-blush-bow.mp4' where slug = 'wedding-blush-bow';
