"use client";

import { useRef, useState, useTransition } from "react";
import { AddressBook, Check, FileArrowUp, X } from "@phosphor-icons/react";
import { COUNTRY_CODES, dialCodeForCountry } from "@/lib/countryCodes";
import { MAX_GUESTS_PER_INVITE, MAX_SEATS_PER_GUEST, checkGuest, formatPhone } from "@/lib/guestRules";
import { useHydrated } from "@/lib/useHydrated";
import { addGuest, importGuests } from "../guestActions";
import { contactPicker, pickContacts, readGuestFile, type ImportRow } from "../_lib/guestImport";
import GuestForm, { DEFAULT_COUNTRY, fieldClass } from "./GuestForm";
import { Button } from "./ui";
import { Segmented, Sheet } from "./ui-client";

type Tab = "one" | "import";

// The "Add guests" panel: one guest by hand, or many from a spreadsheet or
// the phone's contacts (checked in a preview before anything is added).
export default function AddGuestsSheet({
  open,
  onClose,
  token,
  say,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  say: (text: string, error?: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("one");
  const [importCountry, setImportCountry] = useState(DEFAULT_COUNTRY);
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const [fileError, setFileError] = useState("");
  // Shown inside the panel: a toast would sit behind the open dialog.
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  // The contact picker exists only in some browsers (Android Chrome): checked
  // after hydration so the server and browser render the same first.
  const hydrated = useHydrated();
  const canPickContacts = hydrated && contactPicker() !== null;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileError("");
    try {
      const parsed = await readGuestFile(file, dialCodeForCountry(importCountry));
      if (parsed.length === 0) setFileError("We couldn't find any guests in that file.");
      else setPreview(parsed);
    } catch {
      setFileError("We couldn't read that file. Save it as .xlsx or .csv and try again.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function fromContacts() {
    setFileError("");
    try {
      const picked = await pickContacts(dialCodeForCountry(importCountry));
      if (picked.length) setPreview(picked);
    } catch {
      setFileError("Couldn't open your contacts.");
    }
  }

  const checked = preview?.map((r) => checkGuest(r)) ?? [];
  const valid = checked.flatMap((c) => ("guest" in c ? [c.guest] : []));

  function confirmImport() {
    startTransition(async () => {
      const r = await importGuests(token, valid);
      if ("error" in r) return setFileError(r.error);
      setPreview(null);
      const skippedText = r.skipped.length
        ? ` ${r.skipped.length} skipped: ${r.skipped
            .slice(0, 3)
            .map((s) => `${valid[s.line - 1]?.name ?? `line ${s.line}`} (${s.reason.replace(/\.$/, "").toLowerCase()})`)
            .join(", ")}${r.skipped.length > 3 ? "…" : ""}.`
        : "";
      if (r.added === 0) return setFileError(`No guests were added.${skippedText}`);
      say(`${r.added} guest${r.added === 1 ? "" : "s"} added.${skippedText}`);
      onClose();
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={preview ? "Check before adding" : "Add guests"}
      description={
        preview
          ? `${valid.length} of ${preview.length} ready to add. Lines with a problem are skipped; you can add them by hand afterwards.`
          : "Each guest gets a personal invitation with their name and seats."
      }
      footer={
        preview ? (
          <>
            <Button onClick={() => setPreview(null)}>Back</Button>
            <Button variant="primary" disabled={valid.length === 0 || pending} onClick={confirmImport}>
              {pending ? "Adding…" : `Add ${valid.length} guest${valid.length === 1 ? "" : "s"}`}
            </Button>
          </>
        ) : undefined
      }
    >
      {preview && fileError && (
        <p role="alert" className="mb-3 rounded-xl bg-[var(--danger-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--danger)]">
          {fileError}
        </p>
      )}
      {preview ? (
        <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] text-[13px]">
          {preview.map((r, i) => {
            const c = checked[i];
            return (
              <li key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="w-5 shrink-0 text-right text-[12px] tabular-nums text-[var(--ink)]/65">{i + 1}</span>
                {"guest" in c ? (
                  <>
                    <Check size={14} weight="bold" className="shrink-0 text-[var(--coming)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.guest.name}</span>
                      <span className="block tabular-nums text-[12px] text-[var(--ink)]/65">
                        {formatPhone(c.guest.phone)} · {c.guest.seats} seat{c.guest.seats === 1 ? "" : "s"}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <X size={14} weight="bold" className="shrink-0 text-[var(--danger)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.name || "(no name)"}</span>
                      <span className="block text-[12px] text-[var(--danger)]">{c.error}</span>
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <Segmented<Tab>
            label="How to add guests"
            value={tab}
            onChange={setTab}
            options={[
              { value: "one", label: "One guest" },
              { value: "import", label: canPickContacts ? "Import or contacts" : "Import a spreadsheet" },
            ]}
          />

          <div className="mt-5">
            {tab === "one" ? (
              <>
                {lastAdded && (
                  <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--coming-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--coming)]">
                    <Check size={14} weight="bold" />
                    {lastAdded} was added. Add another, or close this panel.
                  </p>
                )}
                <GuestForm
                  submitLabel="Add guest"
                  onSubmit={async (g) => {
                    const r = await addGuest(token, g);
                    if ("error" in r) return r.error;
                    setLastAdded(g.name);
                    return null;
                  }}
                />
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-[var(--cream)] p-4 text-[13px] leading-relaxed text-[var(--ink)]/70">
                  <p className="font-semibold text-[var(--ink)]">Your file needs one guest per row:</p>
                  <ol className="mt-1.5 list-decimal pl-5">
                    <li>Name</li>
                    <li>WhatsApp number</li>
                    <li>Number of seats</li>
                  </ol>
                  <p className="mt-1.5">
                    In that order, or with those column titles. Excel (.xlsx) or .csv, up to {MAX_GUESTS_PER_INVITE} guests and{" "}
                    {MAX_SEATS_PER_GUEST} seats each.
                  </p>
                </div>

                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--ink)]/60">
                  Numbers without a country code are from
                  <select value={importCountry} onChange={(e) => setImportCountry(e.target.value)} className={fieldClass}>
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.dial} {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <input
                  ref={fileInput}
                  type="file"
                  accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-black/15 px-6 py-8 text-center transition hover:border-[var(--blue-dark)] hover:bg-[var(--cream)]/60"
                >
                  <FileArrowUp size={26} className="text-[var(--ink)]/65" />
                  <span className="text-[14px] font-semibold">Choose a spreadsheet</span>
                  <span className="text-[13px] text-[var(--ink)]/65">You&apos;ll check every row before anything is added.</span>
                </button>

                {canPickContacts && (
                  <Button onClick={fromContacts} icon={<AddressBook size={16} />}>
                    Pick from my contacts
                  </Button>
                )}

                {fileError && (
                  <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--danger)]">
                    {fileError}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
