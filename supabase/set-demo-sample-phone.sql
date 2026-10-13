-- Run this in the Supabase SQL Editor (already applied to the live database).
-- Demo invites had the literal text 'none' as their WhatsApp number, which
-- the Blush Bow demo showed as "Phone: none". This swaps it for an obvious
-- placeholder (+961 70 000 000). On demos the number and the WhatsApp button
-- are display-only — see WhatsappConfirmLink.tsx and app/i/[slug]/page.tsx.

update invites
set whatsapp_number = '96170000000'
where is_demo = true
  and whatsapp_number = 'none';
