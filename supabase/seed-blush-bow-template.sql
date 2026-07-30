-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the new "Blush Bow" wedding template so it shows up in the
-- wedding category gallery and can be ordered like the other templates.

insert into templates (slug, name, category, source)
values ('wedding-blush-bow', 'Blush Bow Wedding', 'wedding', 'static')
on conflict (slug) do nothing;

-- Optional: once you have a real thumbnail image, set it like this:
-- update templates set thumbnail_url = '/templates/wedding-blush-bow.jpg'
-- where slug = 'wedding-blush-bow';

-- Optional: once you have a real live invite built on this template, flag
-- it as the demo so the template detail page and the homepage can link to
-- it as a live example (same pattern as sarah-karim / rami-rasha):
-- update invites set is_demo = true where slug = '<your-demo-invite-slug>';
