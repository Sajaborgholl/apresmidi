-- Run this in the Supabase SQL Editor.
-- Sets up a Storage bucket for customer-uploaded invite photos, so the
-- future customize page has somewhere real to upload photos to (instead
-- of me manually dropping files into public/ and hand-writing SQL).

-- Create the bucket. Public = true means anyone with a file's link can
-- view it (same openness level photos already have today) — it does NOT
-- mean anyone can upload to it.
insert into storage.buckets (id, name, public)
values ('invite-photos', 'invite-photos', true)
on conflict (id) do nothing;

-- Allow public read access to files in this bucket, so photo URLs work on
-- the live invite pages guests view.
drop policy if exists "Public read access for invite photos" on storage.objects;

create policy "Public read access for invite photos"
on storage.objects for select
using (bucket_id = 'invite-photos');

-- Deliberately no insert/update/delete policy for the public role here —
-- uploads will go through the server's admin (service-role) client later,
-- which bypasses RLS entirely, the same way every other write in this app
-- already works. Nobody can upload directly from the browser.
