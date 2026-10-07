-- Run this in the Supabase SQL Editor. Safe to run before or after deploying.
--
-- Backstop for the format/size checks in lib/invitePhotos.ts: Storage itself
-- now refuses anything that isn't a JPG, PNG or WebP under 8 MB, even if a
-- bug in the app ever lets one through. Keep these in sync with
-- ALLOWED_PHOTO_TYPES and MAX_PHOTO_SIZE_MB in lib/types.ts.
--
-- Only affects new uploads; photos already in the bucket are untouched.

update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
  file_size_limit = 8 * 1024 * 1024
where id = 'invite-photos';

-- Check:
select id, public, allowed_mime_types, file_size_limit from storage.buckets where id = 'invite-photos';
