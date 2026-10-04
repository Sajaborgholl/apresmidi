-- Run this AFTER seed-bachelorette-martini-template.sql, in the SQL Editor,
-- to create the demo invite for the Martini Bachelorette template. View it
-- locally at http://localhost:3000/i/olivia-martini
--
-- Generic placeholder details, matching the Canva source design ("Olivia",
-- "7th August", "123 Anywhere St., Any City"). No WhatsApp number, map
-- link or photos — this template doesn't use them.

insert into invites (
  slug, template_id, host_names, event_date, venue_name, status
)
select
  'olivia-martini',
  id,
  'Olivia',
  '2027-08-07 21:00:00+03',
  '123 Anywhere St., Any City',
  'live'
from templates where slug = 'bachelorette-martini'
on conflict (slug) do nothing;
