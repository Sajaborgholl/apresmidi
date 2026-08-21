-- Run this in the Supabase SQL Editor.
-- Flags the olivia-disco test invite as the demo for birthday-disco, so it
-- shows a live preview on the homepage and template detail page, the same
-- way sarah-karim and rami-rasha already do for the other templates.

update invites set is_demo = true where slug = 'olivia-disco';
