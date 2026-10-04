-- Run this in the Supabase SQL Editor, after seed-bachelorette-doodle-demo.sql.
-- Flags sarina-doodle as the demo for bachelorette-doodle, so it shows a
-- live preview on the homepage and template detail page.

update invites set is_demo = true where slug = 'sarina-doodle';
