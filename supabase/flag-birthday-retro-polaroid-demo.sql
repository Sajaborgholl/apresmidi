-- Run this in the Supabase SQL Editor, AFTER seed-birthday-retro-polaroid-demo.sql.
-- Flags the avery-retro-polaroid test invite as the demo for
-- birthday-retro-polaroid, so it shows a live preview on the homepage
-- and template detail page, the same way olivia-disco and
-- rebecca-cream-pink already do for the other birthday templates.

update invites set is_demo = true where slug = 'avery-retro-polaroid';
