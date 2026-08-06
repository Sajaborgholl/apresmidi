-- Run this in the Supabase SQL Editor.
-- Flags the peyton-shane test invite as the demo for wedding-blush-bow, so
-- it shows a live preview on the homepage and template detail page, the
-- same way sarah-karim and rami-rasha already do for the other templates.

update invites set is_demo = true where slug = 'peyton-shane';
