-- Run this AFTER schema.sql, in the SQL Editor, to create one demo invite
-- so you have something to view at /i/sarah-karim

insert into invites (
  slug, template_id, host_names, event_date, venue_name, venue_map_url,
  primary_color, photo_urls, music_url, whatsapp_number, status
)
select
  'sarah-karim',
  id,
  'Sarah & Karim',
  '2027-06-12 18:00:00+03',
  'Phoenicia Hotel, Beirut',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13233!2d35.5!3d33.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDU0JzAwLjAiTiAzNcKwMzAnMDAuMCJF!5e0!3m2!1sen!2slb',
  '#7A5C3E',
  '{}',
  null,
  '96170795973',
  'live'
from templates where slug = 'wedding-classic';
