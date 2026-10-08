import type { SupabaseClient } from "@supabase/supabase-js";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE_MB } from "@/lib/types";

const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

type PhotoType = { mime: (typeof ALLOWED_PHOTO_TYPES)[number]; ext: string };

// A problem with a photo the customer chose (too large, wrong format). Its
// message is written for them, so the actions show it as-is — unlike any
// other error, which gets logged and replaced with a generic message.
export class PhotoError extends Error {}

// Identifies the real format from the file's first bytes (its "magic
// number"), never from its name or the browser-supplied type — both are
// whatever the uploader says they are. Anything that isn't one of
// ALLOWED_PHOTO_TYPES comes back null.
async function detectPhotoType(file: File): Promise<PhotoType | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const at = (offset: number, bytes: number[]) => bytes.every((byte, i) => b[offset + i] === byte);

  if (at(0, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  // "RIFF" .... "WEBP"
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return { mime: "image/webp", ext: "webp" };
  return null;
}

// Shared by createOrder (app/order/[slug]/actions.ts) and updateInvite
// (app/dashboard/[token]/actions.ts). Reads photo_1, photo_2, ... up to the
// template's manifest photoCount (the names CustomizeForm gives its file
// inputs) and uploads each to the invite-photos bucket from
// setup-photo-storage.sql.
//
// Position is preserved with "" for any slot that's empty or fails to
// upload, since templates read photos by fixed index (photo_urls[0], [1],
// [2]) and skipping a slot shouldn't shift the ones after it. When editing,
// `existing` supplies the URL to keep for any slot the host didn't replace.
//
// `versioned` adds a timestamp to the storage path. Needed on edit: the
// public URL of an upsert to the same path would otherwise be served stale
// from the storage CDN's cache, and guests would keep seeing the old photo.
export async function uploadInvitePhotos(
  supabaseAdmin: SupabaseClient,
  formData: FormData,
  inviteSlug: string,
  photoCount: number,
  { existing = [], versioned = false }: { existing?: string[]; versioned?: boolean } = {}
): Promise<string[]> {
  const photoUrls: string[] = [];

  for (let i = 1; i <= photoCount; i++) {
    const file = formData.get(`photo_${i}`);
    let url = existing[i - 1] ?? "";

    if (file instanceof File && file.size > 0) {
      // Backstop for the client-side check in CustomizeForm.tsx (which
      // already clears an oversized file before it can be submitted) —
      // this only fires if that was somehow bypassed (JS disabled,
      // tampering). The calling action shows the PhotoError's message
      // inline on the form.
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        throw new PhotoError(`Photo ${i} exceeds the ${MAX_PHOTO_SIZE_MB}MB limit.`);
      }

      // Same backstop role as the size check: the form already refuses
      // other formats, so only a bypassed form reaches this.
      const type = await detectPhotoType(file);
      if (!type) {
        throw new PhotoError(`Photo ${i} must be a JPG, PNG or WebP image.`);
      }

      // Extension and content type come from the detected format, so a file
      // named "x.html" or "x.exe" can never be stored or served as one.
      const path = versioned ? `${inviteSlug}-${i}-${Date.now()}.${type.ext}` : `${inviteSlug}-${i}.${type.ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("invite-photos")
        .upload(path, file, { upsert: true, contentType: type.mime });

      if (!uploadError) {
        url = supabaseAdmin.storage.from("invite-photos").getPublicUrl(path).data.publicUrl;
      }
    }

    photoUrls.push(url);
  }

  return photoUrls;
}
