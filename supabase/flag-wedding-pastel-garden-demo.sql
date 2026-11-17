-- Run this in the Supabase SQL Editor, after seed-wedding-pastel-garden-demo.sql.
-- Flags the ghina-malek invite as the demo for wedding-pastel-garden, so it
-- shows a live preview on the homepage and template detail page.

update invites set is_demo = true where slug = 'ghina-malek';
