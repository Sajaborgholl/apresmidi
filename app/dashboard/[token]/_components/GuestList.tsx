"use client";

import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import {
  AddressBook,
  Check,
  Copy,
  DownloadSimple,
  Eye,
  FileArrowUp,
  MagnifyingGlass,
  PencilSimple,
  PaperPlaneTilt,
  Plus,
  Trash,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { COUNTRY_CODES, dialCodeForCountry } from "@/lib/countryCodes";
import { MAX_GUESTS_PER_INVITE, MAX_SEATS_PER_GUEST, checkGuest, formatPhone } from "@/lib/guestRules";
import { MAX_LENGTH } from "@/lib/validation";
import { useHydrated } from "@/lib/useHydrated";
import { addGuest, deleteGuest, importGuests, updateGuest } from "../guestActions";
import type { DashboardGuest, SendingState } from "../_lib/format";
import SendPanel, { useSender } from "./SendPanel";
import { relativeTime } from "../_lib/format";
import { contactPicker, pickContacts, readGuestFile, withCountryCode, type ImportRow } from "../_lib/guestImport";
import { Avatar, Pill } from "./ui";

type Filter = "all" | "waiting" | "coming" | "declined";

const DEFAULT_COUNTRY = "Lebanon";

// Same protection as GuestsTable: cells starting with = + - @ would run as
// spreadsheet formulas on the host's machine.
function sheetText(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const DELIVERY_LABEL: Record<NonNullable<DashboardGuest["delivery"]>["status"], string> = {
  queued: "Waiting to send",
  sending: "Sending…",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Not delivered",
  cancelled: "Stopped",
};

function DeliveryLine({ guest }: { guest: DashboardGuest }) {
  const d = guest.delivery;
  if (!d) return <span className="text-[12px] text-[var(--ink)]/45">Invitation not sent</span>;
  const what = d.kind === "reminder" ? "Reminder" : "Invitation";
  if (d.status === "failed") {
    return (
      <span className="text-[12px] font-semibold text-[#b3261e]" title={d.error ?? undefined}>
        {what} not delivered{d.error ? ` — ${d.error.slice(0, 80)}` : ""}
      </span>
    );
  }
  return (
    <span className="text-[12px] text-[var(--ink)]/55">
      {what} {DELIVERY_LABEL[d.status].toLowerCase()}
      {["sent", "delivered", "read"].includes(d.status) ? ` · ${relativeTime(d.at)}` : ""}
    </span>
  );
}

function ReplyPill({ guest }: { guest: DashboardGuest }) {
  if (!guest.reply) return <Pill>Waiting</Pill>;
  if (!guest.reply.attending) return <Pill>Not coming</Pill>;
  return <Pill accent>Coming · {guest.reply.guest_count}</Pill>;
}

const fieldClass =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] outline-none transition focus:border-[var(--blue-dark)]";
const buttonClass =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-2 text-[13px] font-semibold transition hover:border-black/30 active:scale-[0.97] disabled:opacity-40";
const primaryClass =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition hover:opacity-90 active:scale-[0.97] disabled:opacity-40";

// One guest's fields: used to add a guest and to edit one.
function GuestForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; phone: string; seats: number };
  submitLabel: string;
  onSubmit: (guest: { name: string; phone: string; seats: number }) => Promise<string | null>;
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1.3fr_1.6fr_auto]">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--ink)]/60">
          Name
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_LENGTH.personName}
            placeholder="Rami & family"
            required
          />
        </label>
        <div className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--ink)]/60">
          <span id="guest-phone-label">WhatsApp number</span>
          <div className="flex gap-2">
            {!initial && (
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`${fieldClass.replace("w-full", "w-28")} shrink-0 truncate`}
                aria-label="Country code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.dial})
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
        </div>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--ink)]/60">
          Seats
          <select className={`sm:w-24 ${fieldClass}`} value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
            {Array.from({ length: MAX_SEATS_PER_GUEST }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-[13px] font-medium text-[#b3261e]">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryClass} style={{ background: "var(--ink)", color: "var(--cream)" }}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={buttonClass}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// Rows from a spreadsheet or picked contacts, checked before anything is
// added: the host sees exactly which lines will be added and why others won't.
function ImportPreview({
  rows,
  onConfirm,
  onClose,
}: {
  rows: ImportRow[];
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const checked = rows.map((r) => checkGuest(r));
  const ok = checked.filter((c) => "guest" in c).length;
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-[var(--cream)]/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display text-[15px] font-bold">
            {ok} of {rows.length} guest{rows.length === 1 ? "" : "s"} ready to add
          </p>
          <p className="mt-0.5 text-[12.5px] text-[var(--ink)]/55">
            Check the numbers below. Lines with a problem are skipped; you can add them by hand afterwards.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-black/5">
          <X size={16} />
        </button>
      </div>
      <ul className="mt-3 max-h-72 divide-y divide-black/[0.06] overflow-y-auto rounded-xl border border-black/[0.06] bg-white text-[13px]">
        {rows.map((r, i) => {
          const c = checked[i];
          return (
            <li key={i} className="flex items-center gap-3 px-3 py-2">
              <span className="w-6 shrink-0 text-right tabular-nums text-[var(--ink)]/35">{i + 1}</span>
              {"guest" in c ? (
                <>
                  <Check size={14} className="shrink-0 text-[var(--blue-dark)]" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{c.guest.name}</span>
                  <span className="shrink-0 tabular-nums text-[var(--ink)]/60">{formatPhone(c.guest.phone)}</span>
                  <span className="w-14 shrink-0 text-right text-[var(--ink)]/60">
                    {c.guest.seats} seat{c.guest.seats === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <>
                  <X size={14} className="shrink-0 text-[#b3261e]" />
                  <span className="min-w-0 flex-1 truncate">
                    <strong>{r.name || "(no name)"}</strong> <span className="text-[var(--ink)]/55">{r.phone}</span>
                  </span>
                  <span className="shrink-0 text-[12px] text-[#b3261e]">{c.error}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={ok === 0 || pending}
          onClick={() => startTransition(onConfirm)}
          className={primaryClass}
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {pending ? "Adding…" : `Add ${ok} guest${ok === 1 ? "" : "s"}`}
        </button>
        <button type="button" onClick={onClose} className={buttonClass}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function GuestList({
  token,
  guests,
  linkBase,
  fileName,
  sending,
  event,
}: {
  token: string;
  guests: DashboardGuest[];
  // `${site}/i/${slug}/g/` — a guest's link is this plus their token.
  linkBase: string;
  fileName: string;
  sending: SendingState;
  event: { hostNames: string; category: string | null; eventDate: string | null };
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(guests.length === 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const [importCountry, setImportCountry] = useState(DEFAULT_COUNTRY);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // "View" opens the guest's page on this same site (just the path), so it
  // works wherever the dashboard runs; copied links keep the public address.
  const viewBase = new URL(linkBase).pathname;
  const [, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  // The contact picker exists only in some browsers (Android Chrome): checked
  // after hydration so the server and browser render the same first.
  const hydrated = useHydrated();
  const canPickContacts = hydrated && contactPicker() !== null;

  const counts = {
    all: guests.length,
    waiting: guests.filter((g) => !g.reply).length,
    coming: guests.filter((g) => g.reply?.attending).length,
    declined: guests.filter((g) => g.reply && !g.reply.attending).length,
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return guests.filter((g) => {
      const status = !g.reply ? "waiting" : g.reply.attending ? "coming" : "declined";
      const matches = !q || g.name.toLowerCase().includes(q) || (qDigits !== "" && g.phone.includes(qDigits));
      return (filter === "all" || filter === status) && matches;
    });
  }, [guests, filter, query]);

  const say = (text: string, error = false) => setNotice({ text, error });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sender = useSender(token, say, () => setSelected(new Set()));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allShownSelected = rows.length > 0 && rows.every((g) => selected.has(g.id));
  const toggleAllShown = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const g of rows) {
        if (allShownSelected) next.delete(g.id);
        else next.add(g.id);
      }
      return next;
    });

  async function copyLink(g: DashboardGuest) {
    try {
      await navigator.clipboard.writeText(linkBase + g.token);
      setCopied(g.id);
      setTimeout(() => setCopied((c) => (c === g.id ? null : c)), 1800);
    } catch {
      say("Couldn't copy — your browser blocked it. Long-press the link instead.", true);
    }
  }

  function remove(g: DashboardGuest) {
    if (!window.confirm(`Remove ${g.name} from your guest list? Their personal link will stop working.`)) return;
    startTransition(async () => {
      const r = await deleteGuest(token, g.id);
      say("error" in r ? r.error : `${g.name} was removed.`, "error" in r);
    });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = await readGuestFile(file, dialCodeForCountry(importCountry));
      if (parsed.length === 0) return say("We couldn't find any guests in that file.", true);
      setPreview(parsed);
    } catch {
      say("We couldn't read that file. Save it as .xlsx or .csv and try again.", true);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function fromContacts() {
    try {
      const picked = await pickContacts(dialCodeForCountry(importCountry));
      if (picked.length) setPreview(picked);
    } catch {
      say("Couldn't open your contacts.", true);
    }
  }

  async function confirmImport() {
    if (!preview) return;
    const valid = preview.map((r) => checkGuest(r)).flatMap((c) => ("guest" in c ? [c.guest] : []));
    const r = await importGuests(token, valid);
    if ("error" in r) return say(r.error, true);
    setPreview(null);
    const skippedText = r.skipped.length
      ? ` ${r.skipped.length} skipped: ${r.skipped
          .slice(0, 3)
          .map((s) => `${valid[s.line - 1]?.name ?? `line ${s.line}`} (${s.reason.replace(/\.$/, "").toLowerCase()})`)
          .join(", ")}${r.skipped.length > 3 ? "…" : ""}.`
      : "";
    say(`${r.added} guest${r.added === 1 ? "" : "s"} added.${skippedText}`, r.added === 0);
  }

  function exportCsv() {
    const header = ["Name", "WhatsApp", "Seats", "Reply", "Coming", "Message", "Opened", "Personal link"];
    const lines = guests.map((g) =>
      [
        sheetText(g.name),
        formatPhone(g.phone),
        g.seats,
        !g.reply ? "Waiting" : g.reply.attending ? "Coming" : "Not coming",
        g.reply?.attending ? g.reply.guest_count : 0,
        sheetText(g.reply?.message ?? ""),
        g.first_opened_at ? new Date(g.first_opened_at).toISOString() : "",
        linkBase + g.token,
      ]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ---------- Adding guests ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className={primaryClass}
          style={{ background: "var(--ink)", color: "var(--cream)" }}
          aria-expanded={adding}
        >
          <Plus size={15} />
          Add a guest
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass}>
          <FileArrowUp size={15} />
          Import Excel / CSV
        </button>
        {canPickContacts && (
          <button type="button" onClick={fromContacts} className={buttonClass}>
            <AddressBook size={15} />
            From contacts
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <label className="ml-auto flex items-center gap-2 text-[12px] text-[var(--ink)]/55">
          Numbers without a country code are
          <select
            value={importCountry}
            onChange={(e) => setImportCountry(e.target.value)}
            className="rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-[12px] outline-none"
            aria-label="Country for imported numbers without a country code"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.dial})
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="-mt-2 text-[12.5px] text-[var(--ink)]/50">
        A spreadsheet needs a name, WhatsApp number and number of seats per guest (in that order, or with column titles).
        Up to {MAX_GUESTS_PER_INVITE} guests and {MAX_SEATS_PER_GUEST} seats each.
      </p>

      {adding && (
        <div className="rounded-2xl border border-black/[0.08] p-4">
          <GuestForm
            submitLabel="Add guest"
            onSubmit={async (g) => {
              const r = await addGuest(token, g);
              if ("error" in r) return r.error;
              say(`${g.name} was added.`);
              return null;
            }}
          />
        </div>
      )}

      {preview && <ImportPreview rows={preview} onConfirm={confirmImport} onClose={() => setPreview(null)} />}

      {guests.length > 0 && (
        <SendPanel sender={sender} guests={guests} selected={selected} sending={sending} event={event} linkBase={linkBase} />
      )}

      {notice && (
        <p
          role="status"
          className={`rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${
            notice.error ? "bg-[#b3261e]/[0.07] text-[#b3261e]" : "bg-[var(--blue)]/25 text-[var(--ink)]"
          }`}
        >
          {notice.text}
        </p>
      )}

      {/* ---------- The list ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {rows.length > 0 && (
          <label className="flex min-h-[40px] items-center gap-2 text-[13px] font-medium text-[var(--ink)]/65">
            <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} className="h-4 w-4" />
            Select all{filter !== "all" || query ? " shown" : ""}
          </label>
        )}
        <div className="flex w-full gap-1 overflow-x-auto rounded-full bg-black/[0.04] p-1 sm:w-auto">
          {(
            [
              ["all", "All"],
              ["waiting", "Waiting"],
              ["coming", "Coming"],
              ["declined", "Not coming"],
            ] as const
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] transition sm:flex-none ${
                filter === f ? "bg-white font-semibold shadow-sm" : "font-medium text-[var(--ink)]/55 hover:text-[var(--ink)]"
              }`}
            >
              {label} <span className="tabular-nums opacity-50">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <label className="relative flex-1 sm:w-52 sm:flex-none">
            <MagnifyingGlass size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guests"
              aria-label="Search guests"
              className="w-full rounded-full border border-black/10 bg-white py-2 pl-9 pr-3.5 text-[13.5px] outline-none transition focus:border-[var(--blue-dark)]"
            />
          </label>
          <button type="button" onClick={exportCsv} disabled={guests.length === 0} className={buttonClass}>
            <DownloadSimple size={15} />
            Export
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center text-[13.5px] text-[var(--ink)]/55">
          <UsersThree size={24} className="opacity-50" />
          {guests.length === 0
            ? "Add your guests to give each one a personal invitation link with their name and seats."
            : "No guests match that."}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-black/[0.06]">
          {rows.map((g) => (
            <li key={g.id} className="py-3.5">
              {editing === g.id ? (
                <GuestForm
                  initial={g}
                  submitLabel="Save"
                  onCancel={() => setEditing(null)}
                  onSubmit={async (next) => {
                    const r = await updateGuest(token, g.id, next);
                    if ("error" in r) return r.error;
                    setEditing(null);
                    say(r.note ?? `${next.name} was updated.`);
                    return null;
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(g.id)}
                      onChange={() => toggle(g.id)}
                      className="h-4 w-4 shrink-0"
                      aria-label={`Select ${g.name}`}
                    />
                    <Avatar name={g.name} muted={Boolean(g.reply && !g.reply.attending)} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{g.name}</p>
                      <p className="text-[12.5px] tabular-nums text-[var(--ink)]/50">
                        {formatPhone(g.phone)} · {g.seats} seat{g.seats === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 basis-48 flex-col items-start gap-1">
                    <ReplyPill guest={g} />
                    <DeliveryLine guest={g} />
                    <span className="text-[12px] text-[var(--ink)]/45">
                      {g.reply
                        ? `${g.reply.changed ? "Changed" : "Replied"} ${relativeTime(g.reply.replied_at)}`
                        : g.first_opened_at
                          ? `Opened ${relativeTime(g.last_opened_at ?? g.first_opened_at)}`
                          : "Not opened yet"}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {g.delivery?.status !== "queued" && g.delivery?.status !== "sending" && (
                      <button
                        type="button"
                        onClick={() => sender.send([g.id])}
                        disabled={sender.pending}
                        className={buttonClass}
                        aria-label={`Send ${g.name} their invitation on WhatsApp`}
                      >
                        <PaperPlaneTilt size={15} />
                        {!g.delivery || g.delivery.status === "cancelled"
                          ? "Send"
                          : g.delivery.status === "failed"
                            ? "Retry"
                            : "Resend"}
                      </button>
                    )}
                    <button type="button" onClick={() => copyLink(g)} className={buttonClass} aria-label={`Copy ${g.name}'s link`}>
                      {copied === g.id ? <Check size={15} /> : <Copy size={15} />}
                      {copied === g.id ? "Copied" : "Link"}
                    </button>
                    {/* "?host=1" so the host looking doesn't count as the guest opening it. */}
                    <a
                      href={`${viewBase}${g.token}?host=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass}
                      aria-label={`View ${g.name}'s invitation`}
                    >
                      <Eye size={15} />
                    </a>
                    <button type="button" onClick={() => setEditing(g.id)} className={buttonClass} aria-label={`Edit ${g.name}`}>
                      <PencilSimple size={15} />
                    </button>
                    <button type="button" onClick={() => remove(g)} className={buttonClass} aria-label={`Remove ${g.name}`}>
                      <Trash size={15} />
                    </button>
                  </div>
                  {g.reply?.message && (
                    <p className="basis-full pl-12 text-[13px] italic text-[var(--ink)]/60">&ldquo;{g.reply.message}&rdquo;</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
