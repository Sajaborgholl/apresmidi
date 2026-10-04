-- Run this AFTER seed-bachelorette-doodle-template.sql, in the SQL Editor,
-- to create the demo invite for the Doodle Bachelorette template. View it
-- locally at http://localhost:3000/i/sarina-doodle
--
-- Generic placeholder details, matching the Canva source design ("Sarina",
-- "123 Any Where St., Any City"). No WhatsApp number, map link or photos —
-- this template doesn't use them.

insert into invites (
  slug, template_id, host_names, event_date, venue_name, status
)
select
  'sarina-doodle',
  id,
  'Sarina',
  '2027-08-07 20:00:00+03',
  '123 Any Where St., Any City',
  'live'
from templates where slug = 'bachelorette-doodle'
on conflict (slug) do nothing;
