-- Run this in the Supabase SQL Editor (already applied to the live database).
-- Gives the Blush Bow demo invite the same When/Where details as the
-- Wedding Classic demo (sarah-karim), so its preview shows a date, a venue
-- and a "View map" link instead of the "not decided yet" placeholders.

update invites
set
  event_date = '2027-06-12 15:00:00+00',
  venue_name = '123 Anywhere Street, Any City',
  venue_map_url = 'https://maps.google.com/?q=123+Anywhere+Street'
where slug = 'peyton-shane';
