-- Run this in the Supabase SQL Editor, after seed-wedding-retro-airmail-demo.sql.
-- Flags the jad-mariana invite as the demo for wedding-retro-airmail, so it
-- shows a live preview on the homepage and template detail page.

update invites set is_demo = true where slug = 'jad-mariana';
