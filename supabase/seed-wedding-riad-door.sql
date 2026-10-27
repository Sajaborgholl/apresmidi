-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- Registers the "Riad Door" wedding template so it shows up in the
-- wedding gallery and can be ordered, and adds its demo invite (lea-karim)
-- for the homepage / template page previews. Safe to re-run.

insert into templates (slug, name, category, source)
values ('wedding-riad-door', 'Riad Door Wedding', 'wedding', 'static')
on conflict (slug) do nothing;

insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  whatsapp_number, status, is_demo
)
select
  'lea-karim',
  id,
  'Lea & Karim',
  '2027-06-12 18:30:00+00',
  'Domaine des Tourelles, Chtaura',
  'https://maps.google.com/?q=Domaine+des+Tourelles+Chtaura',
  '96170000000',
  'live',
  true
from templates where slug = 'wedding-riad-door'
on conflict (slug) do nothing;
