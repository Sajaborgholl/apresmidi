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

type Tab = "one" | "contacts" | "import";

// The "Numbers without a country code are from" choice, shown on both the
// contacts and spreadsheet tabs.
function ImportCountry({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--ink)]/60">
      Numbers without a country code are from
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {COUNTRY_CODES.map((c) => (
          <option key={c.name} value={c.name}>
            {c.dial} {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

const dropZoneClass =
  "flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-black/15 px-6 py-8 text-center transition hover:border-[var(--blue-dark)] hover:bg-[var(--cream)]/60";

// The "Add guests" panel: one guest by hand, many from the phone's contacts
// (the browser's picker on Android Chrome, or a .vcf file exported from the
// Contacts app on iPhone and elsewhere), or many from a spreadsheet. Imports
// are checked in a preview before anything is added.
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
  const contactsInput = useRef<HTMLInputElement>(null);
  // The contact picker exists only in some browsers (Android Chrome): checked
  // after hydration so the server and browser render the same first.
  const hydrated = useHydrated();
  const canPickContacts = hydrated && contactPicker() !== null;

  async function onFile(input: HTMLInputElement | null, kind: "contacts" | "spreadsheet") {
    const file = input?.files?.[0];
    if (!file) return;
    setFileError("");
    try {
      const parsed = await readGuestFile(file, dialCodeForCountry(importCountry));
      if (parsed.length === 0) {
        setFileError(
          kind === "contacts"
            ? "We couldn't find any contacts with a name or number in that file."
            : "We couldn't find any guests in that file.",
        );
      } else if (parsed.length > MAX_GUESTS_PER_INVITE) {
        setFileError(
          `That file has ${parsed.length} ${kind === "contacts" ? "contacts" : "rows"}; a guest list holds up to ${MAX_GUESTS_PER_INVITE}. ${
            kind === "contacts" ? "Export a list with just your guests." : "Split it and import each part."
          }`,
        );
      } else setPreview(parsed);
    } catch {
      setFileError(
        kind === "contacts"
          ? "We couldn't read that contacts file. Export it again as a vCard (.vcf) and try again."
          : "We couldn't read that file. Save it as .xlsx or .csv and try again.",
      );
    } finally {
      if (input) input.value = "";
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
            onChange={(t) => {
              setTab(t);
              setFileError("");
            }}
            options={[
              { value: "one", label: "One guest" },
              { value: "contacts", label: "From contacts" },
              { value: "import", label: "Spreadsheet" },
            ]}
          />

          <div className="mt-5">
            <input
              ref={contactsInput}
              type="file"
              accept=".vcf,text/vcard,text/x-vcard,text/directory"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => onFile(e.currentTarget, "contacts")}
            />
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
            ) : tab === "contacts" ? (
              <div className="flex flex-col gap-4">
                {canPickContacts ? (
                  <>
                    <Button variant="primary" onClick={fromContacts} icon={<AddressBook size={16} />}>
                      Pick from my contacts
                    </Button>
                    <p className="-mt-1 text-center text-[13px] text-[var(--ink)]/65">
                      You&apos;ll check every contact before anything is added.{" "}
                      <button
                        type="button"
                        onClick={() => contactsInput.current?.click()}
                        className="font-semibold text-[var(--ink)] underline underline-offset-2"
                      >
                        Or upload a contacts file (.vcf)
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => contactsInput.current?.click()} className={dropZoneClass}>
                      <AddressBook size={26} className="text-[var(--ink)]/65" />
                      <span className="text-[14px] font-semibold">Choose a contacts file (.vcf)</span>
                      <span className="text-[13px] text-[var(--ink)]/65">You&apos;ll check every contact before anything is added.</span>
                    </button>
                    <div className="rounded-2xl bg-[var(--cream)] p-4 text-[13px] leading-relaxed text-[var(--ink)]/70">
                      <p className="font-semibold text-[var(--ink)]">Getting the file</p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5">
                        <li>
                          <span className="font-semibold text-[var(--ink)]">iPhone:</span> open Contacts, tap Lists, touch and hold a list, then
                          tap Export. Save it to Files and choose it here.
                        </li>
                        <li>
                          <span className="font-semibold text-[var(--ink)]">Android or computer:</span> export from Google Contacts or your
                          Contacts app as a vCard (.vcf).
                        </li>
                      </ul>
                      <p className="mt-1.5">Tip: make a list of just your guests first, rather than exporting everyone.</p>
                    </div>
                  </>
                )}

                <ImportCountry value={importCountry} onChange={setImportCountry} />

                {fileError && (
                  <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--danger)]">
                    {fileError}
                  </p>
                )}
              </div>
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

                <ImportCountry value={importCountry} onChange={setImportCountry} />

                <input
                  ref={fileInput}
                  type="file"
                  accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => onFile(e.currentTarget, "spreadsheet")}
                />
                <button type="button" onClick={() => fileInput.current?.click()} className={dropZoneClass}>
                  <FileArrowUp size={26} className="text-[var(--ink)]/65" />
                  <span className="text-[14px] font-semibold">Choose a spreadsheet</span>
                  <span className="text-[13px] text-[var(--ink)]/65">You&apos;ll check every row before anything is added.</span>
                </button>

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
