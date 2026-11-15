"use client";

import { useState, useTransition, type FormEvent } from "react";
import { COUNTRY_CODES, dialCodeForCountry } from "@/lib/countryCodes";
import { MAX_SEATS_PER_GUEST, checkGuest } from "@/lib/guestRules";
import { MAX_LENGTH } from "@/lib/validation";
import { withCountryCode } from "../_lib/guestImport";
import { Button } from "./ui";

export const DEFAULT_COUNTRY = "Lebanon";

export const fieldClass =
  "w-full rounded-xl border border-black/[0.12] bg-white px-3.5 py-2.5 text-[14px] outline-none transition placeholder:text-[var(--ink)]/30 focus:border-[var(--blue-dark)] focus:ring-4 focus:ring-[var(--blue)]/25";

export type GuestFields = { name: string; phone: string; seats: number };

// One guest's fields, stacked for the side panel: used to add a guest and to
// edit one. `onSubmit` returns an error to show, or null when it's saved.
export default function GuestForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: GuestFields;
  submitLabel: string;
  onSubmit: (guest: GuestFields) => Promise<string | null>;
  onCancel?: () => void;
}) {
  // Editing shows the stored number as it is (+ and country code); adding
  // starts with the country picker so hosts can type local numbers.
  const [country, setCountry] = useState(initial ? "" : DEFAULT_COUNTRY);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial ? `+${initial.phone}` : "");
  const [seats, setSeats] = useState(initial?.seats ?? 1);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const full = withCountryCode(phone, dialCodeForCountry(country));
    const checked = checkGuest({ name, phone: full, seats });
    if ("error" in checked) return setError(checked.error);
    setError("");
    startTransition(async () => {
      const err = await onSubmit(checked.guest);
      if (err) return setError(err);
      if (!initial) {
        setName("");
        setPhone("");
        setSeats(1);
      }
    });
  }

  const label = "flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--ink)]/60";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className={label}>
        Name
        <input
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_LENGTH.personName}
          placeholder="e.g. Rami Haddad, or The Haddad family"
          autoFocus
          required
        />
      </label>

      <div className={label}>
        <span id="guest-phone-label">WhatsApp number</span>
        <div className="flex gap-2">
          {!initial && (
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={`${fieldClass.replace("w-full", "w-[7.5rem]")} shrink-0 truncate`}
              aria-label="Country code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.dial} {c.name}
                </option>
              ))}
            </select>
          )}
          <input
            className={fieldClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={MAX_LENGTH.phone}
            inputMode="tel"
            placeholder={initial ? "+961 70 123 456" : "70 123 456"}
            aria-labelledby="guest-phone-label"
            required
          />
        </div>
        <span className="font-normal text-[var(--ink)]/65">Their invitation is sent to this number.</span>
      </div>

      <div className={label}>
        <span id="guest-seats-label">Seats reserved</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby="guest-seats-label">
          {Array.from({ length: MAX_SEATS_PER_GUEST }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={seats === n}
              onClick={() => setSeats(n)}
              className={`h-9 w-9 rounded-xl border text-[14px] font-semibold tabular-nums transition ${
                seats === n ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--cream)]" : "border-black/[0.12] bg-white text-[var(--ink)]/70 hover:border-black/30"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="font-normal text-[var(--ink)]/65">The most people this guest can confirm, themselves included.</span>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
