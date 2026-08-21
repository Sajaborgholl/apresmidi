import { Image as ImageIcon } from "@phosphor-icons/react";
import type { TemplateFieldManifest } from "@/lib/templates/registry";

// Plain-string values for every possible field. CustomizeForm only reads
// the ones a given template's manifest actually turns on — the rest are
// simply ignored/not rendered.
export type CustomizeValues = {
  owner_email: string;
  host_names: string;
  event_date: string;
  venue_name: string;
  venue_map_url: string;
  whatsapp_number: string;
  age: string;
};

export const EMPTY_VALUES: CustomizeValues = {
  owner_email: "",
  host_names: "",
  event_date: "",
  venue_name: "",
  venue_map_url: "",
  whatsapp_number: "",
  age: "",
};

const inputClass =
  "w-full rounded-xl border-[1.5px] border-black/15 bg-[var(--cream)] px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] outline-none transition focus:border-[var(--blue-dark)] focus:bg-white";
const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]/65";

// Renders only the inputs a given template's field manifest (step 1) says
// it actually uses — e.g. Bachelorette shows no WhatsApp field and no
// photo pickers at all, while Classic shows every field plus 3 photo
// slots. Controlled (value + onChange) so the live preview reacts
// instantly to typing — still has real `name` attributes too, so
// submitting this as a normal form keeps working via FormData.
export default function CustomizeForm({
  fields,
  values,
  onValueChange,
  photoPreviews,
  onPhotoChange,
}: {
  fields: TemplateFieldManifest;
  values: CustomizeValues;
  onValueChange: (name: keyof CustomizeValues, value: string) => void;
  photoPreviews: (string | undefined)[];
  onPhotoChange: (index: number, file: File | null) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Unconditional — every order needs this regardless of the
          template's field manifest, since it's checkout-level contact
          info (receipt + dashboard link), not invite content. */}
      <div>
        <label className={labelClass}>Your email *</label>
        <input
          name="owner_email"
          type="email"
          required
          placeholder="you@email.com"
          value={values.owner_email}
          onChange={(e) => onValueChange("owner_email", e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-[11px] text-[var(--ink)]/45">
          We&apos;ll send your dashboard and guest links here once payment is confirmed.
        </p>
      </div>

      {fields.host_names && (
        <div>
          <label className={labelClass}>Host names *</label>
          <input
            name="host_names"
            required
            placeholder="Sarah & Karim"
            value={values.host_names}
            onChange={(e) => onValueChange("host_names", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.event_date && (
        <div>
          <label className={labelClass}>Event date &amp; time</label>
          <input
            name="event_date"
            type="datetime-local"
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
            placeholder="Merchak Rooftop"
            value={values.venue_name}
            onChange={(e) => onValueChange("venue_name", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.venue_map_url && (
        <div>
          <label className={labelClass}>Venue Google Maps link</label>
          <input
            name="venue_map_url"
            type="url"
            placeholder="https://maps.google.com/..."
            value={values.venue_map_url}
            onChange={(e) => onValueChange("venue_map_url", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.age && (
        <div>
          <label className={labelClass}>Age</label>
          <input
            name="age"
            type="number"
            min={0}
            max={130}
            placeholder="21"
            value={values.age}
            onChange={(e) => onValueChange("age", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.whatsapp_number && (
        <div>
          <label className={labelClass}>WhatsApp number (for RSVP confirmations)</label>
          <input
            name="whatsapp_number"
            placeholder="+961..."
            value={values.whatsapp_number}
            onChange={(e) => onValueChange("whatsapp_number", e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {fields.photoCount > 0 && (
        <div>
          <label className={labelClass}>Photos</label>
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: fields.photoCount }, (_, i) => {
              const preview = photoPreviews[i];
              const inputId = `photo-input-${i}`;
              return (
                <label
                  key={i}
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
                    accept="image/*"
                    onChange={(e) => onPhotoChange(i, e.target.files?.[0] ?? null)}
                    className="absolute h-0 w-0 opacity-0"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
