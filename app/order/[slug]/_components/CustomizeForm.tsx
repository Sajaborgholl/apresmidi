import { useState } from "react";
import { Image as ImageIcon } from "@phosphor-icons/react";
import type { TemplateFieldManifest } from "@/lib/templates/registry";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE_MB } from "@/lib/types";
import { MAX_LENGTH } from "@/lib/validation";

const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

// Plain-string values for every possible field. CustomizeForm only reads
// the ones a given template's manifest actually turns on — the rest are
// simply ignored/not rendered.
// (The host's email isn't here: it's asked for, confirmed and verified in a
// dialog at "Continue to payment" — EmailVerifyDialog.tsx.)
export type CustomizeValues = {
  host_names: string;
  event_date: string;
  venue_name: string;
  venue_map_url: string;
  dress_code: string;
  guest_message: string;
  highlight_1: string;
  highlight_2: string;
  highlight_3: string;
};

export const EMPTY_VALUES: CustomizeValues = {
  host_names: "",
  event_date: "",
  venue_name: "",
  venue_map_url: "",
  dress_code: "",
  guest_message: "",
  highlight_1: "",
  highlight_2: "",
  highlight_3: "",
};

// No width baked in here — composed with the actual width utility at each
// call site instead, since a fixed-width field (the country code select)
// combined with this via a template literal would otherwise have both
// `w-full` and `w-24` in its class list, an ordering-dependent conflict
// that isn't guaranteed to resolve to the narrower one.
const inputFieldClass =
  "rounded-xl border-[1.5px] border-black/15 bg-[var(--cream)] px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] outline-none transition focus:border-[var(--blue-dark)] focus:bg-white";
const inputClass = `w-full ${inputFieldClass}`;
const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]/65";

// Renders only the inputs a given template's field manifest (step 1) says
// it actually uses — e.g. Bachelorette shows no photo pickers at all, while
// Classic shows every field plus 3 photo slots. Controlled (value + onChange) so the live preview reacts
// instantly to typing — still has real `name` attributes too, so
// submitting this as a normal form keeps working via FormData.
export default function CustomizeForm({
  fields,
  category,
  values,
  onValueChange,
  photoPreviews,
  onPhotoChange,
}: {
  fields: TemplateFieldManifest;
  category: string;
  values: CustomizeValues;
  onValueChange: (name: keyof CustomizeValues, value: string) => void;
  photoPreviews: (string | undefined)[];
  onPhotoChange: (index: number, file: File | null) => void;
}) {
  // Birthdays and bachelorettes are celebrating one person, unlike a
  // wedding's two hosts — so the field asks for (and previews) a single
  // name instead of a "Name & Name" pair.
  const isSingleHost = category === "birthday" || category === "bachelorette";
  // Local to this component — CustomizePanel only needs to know about
  // valid selections (it drives the live preview + the real upload), not
  // rejected ones.
  const [photoErrors, setPhotoErrors] = useState<(string | undefined)[]>([]);

  function handlePhotoInputChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    // The server re-checks the real format from the file's bytes; this is
    // just so a host hears about it here, not as a failed submission.
    const error = !file
      ? undefined
      : !(ALLOWED_PHOTO_TYPES as readonly string[]).includes(file.type)
        ? "Please use a JPG, PNG or WebP photo."
        : file.size > MAX_PHOTO_SIZE_BYTES
          ? `That photo is too large — please choose one under ${MAX_PHOTO_SIZE_MB}MB.`
          : undefined;

    if (error) {
      setPhotoErrors((prev) => {
        const next = [...prev];
        next[index] = error;
        return next;
      });
      // Clears the input's own file list too, not just our preview state —
      // otherwise the rejected file would still ride along when the real
      // <form> is submitted, since that reads straight from the browser's
      // native FormData rather than from onPhotoChange's argument.
      e.target.value = "";
      onPhotoChange(index, null);
      return;
    }

    setPhotoErrors((prev) => {
      const next = [...prev];
      next[index] = undefined;
      return next;
    });
    onPhotoChange(index, file);
  }

  return (
    <div className="flex flex-col gap-5">
      {fields.host_names && (
        <div>
          <label className={labelClass}>{isSingleHost ? "Host name *" : "Host names *"}</label>
          <input
            name="host_names"
            maxLength={MAX_LENGTH.hostNames}
            required
            placeholder={isSingleHost ? "Alex" : "Alex & Jordan"}
            value={values.host_names}
            onChange={(e) => onValueChange("host_names", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.event_date && (
        <div>
          <label className={labelClass}>Event date &amp; time *</label>
          <input
            name="event_date"
            type="datetime-local"
            required
            value={values.event_date}
            onChange={(e) => onValueChange("event_date", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.venue_name && (
        <div>
          <label className={labelClass}>Venue name</label>
          <input
            name="venue_name"
            maxLength={MAX_LENGTH.venueName}
            placeholder="The Grand Hall"
            value={values.venue_name}
            onChange={(e) => onValueChange("venue_name", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.venue_map_url && (
        <div>
          <label className={labelClass}>Venue map link</label>
          <input
            name="venue_map_url"
            maxLength={MAX_LENGTH.venueMapUrl}
            // Text, not type="url": the browser would reject a pasted
            // "maps.app.goo.gl/…" without https://, which the server accepts
            // and completes (lib/validation.ts).
            type="text"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="https://maps.google.com/..."
            value={values.venue_map_url}
            onChange={(e) => onValueChange("venue_map_url", e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-[var(--ink)]/45">A Google Maps, Apple Maps or Waze link.</p>
        </div>
      )}

      {/* Optional words, only on designs with a place for them. Empty ones
          leave that spot out of the invitation. */}
      {fields.dress_code && (
        <div>
          <label className={labelClass}>Dress code</label>
          <input
            name="dress_code"
            maxLength={MAX_LENGTH.dressCode}
            placeholder="e.g. Cocktail attire"
            value={values.dress_code}
            onChange={(e) => onValueChange("dress_code", e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-[var(--ink)]/45">Optional. Leave it empty to hide it.</p>
        </div>
      )}

      {fields.guest_message && (
        <div>
          <label className={labelClass}>A note for your guests</label>
          <textarea
            name="guest_message"
            maxLength={MAX_LENGTH.guestMessage}
            rows={3}
            placeholder="A few words for the people you're inviting"
            value={values.guest_message}
            onChange={(e) => onValueChange("guest_message", e.target.value)}
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1 text-[11px] text-[var(--ink)]/45">Optional. Leave it empty to hide it.</p>
        </div>
      )}

      {(fields.highlights ?? 0) > 0 && (
        <div>
          <label className={labelClass}>What to expect</label>
          <div className="flex flex-col gap-2">
            {(["highlight_1", "highlight_2", "highlight_3"] as const).slice(0, fields.highlights).map((key, i) => (
              <input
                key={key}
                name={key}
                maxLength={MAX_LENGTH.highlight}
                placeholder={["e.g. Dinner and drinks", "e.g. Games and prizes", "e.g. Dancing all night"][i]}
                value={values[key]}
                onChange={(e) => onValueChange(key, e.target.value)}
                className={inputClass}
                aria-label={`What to expect ${i + 1}`}
              />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-[var(--ink)]/45">Optional. Shown under your photos; empty lines are hidden.</p>
        </div>
      )}

      {fields.photoCount > 0 && (
        <div>
          <label className={labelClass}>Photos *</label>
          <p className="mb-2 -mt-1 text-[11px] text-[var(--ink)]/45">
            {fields.photoCount === 1 ? "A photo is needed" : `All ${fields.photoCount} photos are needed`}. JPG, PNG or
            WebP, max {MAX_PHOTO_SIZE_MB}MB per photo.
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: fields.photoCount }, (_, i) => {
              const preview = photoPreviews[i];
              const inputId = `photo-input-${i}`;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <label
                    htmlFor={inputId}
                    className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-[1.5px] border-dashed border-black/25 bg-[var(--cream)] text-[11px] text-[var(--ink)]/45 transition hover:border-[var(--blue-dark)] hover:text-[var(--blue-dark)]"
                  >
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={`Photo ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon size={20} weight="light" />
                        Photo {i + 1}
                      </>
                    )}
                    <input
                      id={inputId}
                      name={`photo_${i + 1}`}
                      type="file"
                      accept={ALLOWED_PHOTO_TYPES.join(",")}
                      onChange={(e) => handlePhotoInputChange(i, e)}
                      className="absolute h-0 w-0 opacity-0"
                    />
                  </label>
                  {photoErrors[i] && (
                    <p className="text-[10px] font-medium leading-tight" style={{ color: "#B23" }}>
                      {photoErrors[i]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
