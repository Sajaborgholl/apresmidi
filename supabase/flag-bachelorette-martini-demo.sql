-- Run this in the Supabase SQL Editor, after seed-bachelorette-martini-demo.sql.
-- Flags olivia-martini as the demo for bachelorette-martini, so it shows a
-- live preview on the homepage and template detail page, the same way
-- olivia-disco does for birthday-disco.

update invites set is_demo = true where slug = 'olivia-martini';
