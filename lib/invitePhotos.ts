import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_PHOTO_SIZE_MB } from "@/lib/types";

const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

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
      // tampering), so a thrown Error here is an acceptable fallback
      // rather than a friendly inline message.
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        throw new Error(`Photo ${i} exceeds the ${MAX_PHOTO_SIZE_MB}MB limit.`);
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = versioned ? `${inviteSlug}-${i}-${Date.now()}.${ext}` : `${inviteSlug}-${i}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("invite-photos")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });

      if (!uploadError) {
        url = supabaseAdmin.storage.from("invite-photos").getPublicUrl(path).data.publicUrl;
      }
    }

    photoUrls.push(url);
  }

  return photoUrls;
}
