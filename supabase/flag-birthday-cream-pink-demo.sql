-- Run this in the Supabase SQL Editor, AFTER seed-birthday-cream-pink-demo.sql.
-- Flags the rebecca-cream-pink test invite as the demo for
-- birthday-cream-pink, so it shows a live preview on the homepage and
-- template detail page, the same way olivia-disco does for birthday-disco.

update invites set is_demo = true where slug = 'rebecca-cream-pink';
