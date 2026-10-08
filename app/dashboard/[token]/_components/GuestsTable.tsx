"use client";

import { useMemo, useState } from "react";
import { DownloadSimple, MagnifyingGlass, UsersThree } from "@phosphor-icons/react";
import type { DashboardRsvp } from "../_lib/format";
import { Avatar, StatusPill } from "./ui";

type Filter = "all" | "attending" | "declined";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Spreadsheet apps run any cell starting with = + - @ (or tab/CR) as a
// formula. Names and messages are typed by whoever has the guest link, so a
// "name" like =HYPERLINK(...) would otherwise become live on the host's
// machine. A leading apostrophe makes the app treat it as plain text
// (OWASP's recommended fix). Only for guest-typed text: numbers and dates
// here come from the app.
function guestText(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Filtering, search and CSV export all run on the rows the server already
// loaded — no extra route or fetch needed for any of it.
export default function GuestsTable({ rsvps, fileName }: { rsvps: DashboardRsvp[]; fileName: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = {
    all: rsvps.length,
    attending: rsvps.filter((r) => r.attending).length,
    declined: rsvps.filter((r) => !r.attending).length,
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter(
      (r) =>
        (filter === "all" || (filter === "attending") === r.attending) &&
        (!q || r.guest_name.toLowerCase().includes(q))
    );
  }, [rsvps, filter, query]);

  function exportCsv() {
    const header = ["Name", "Status", "Guests", "Message", "Responded"];
    const lines = rsvps.map((r) =>
      [
        guestText(r.guest_name),
        r.attending ? "Attending" : "Declined",
        r.attending ? r.guest_count ?? 1 : 0,
        guestText(r.message ?? ""),
        new Date(r.created_at).toISOString(),
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full gap-1 rounded-full bg-black/[0.04] p-1 sm:w-auto">
          {(["all", "attending", "declined"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] capitalize transition sm:flex-none ${
                filter === f ? "bg-white font-semibold shadow-sm" : "font-medium text-[var(--ink)]/55 hover:text-[var(--ink)]"
              }`}
            >
              {f} <span className="tabular-nums opacity-50">{counts[f]}</span>
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
          <button
            type="button"
            onClick={exportCsv}
            disabled={rsvps.length === 0}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-2 text-[13px] font-semibold transition hover:border-black/30 active:scale-[0.97] disabled:opacity-40"
          >
            <DownloadSimple size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center text-[13.5px] text-[var(--ink)]/55">
          <UsersThree size={24} className="opacity-50" />
          {rsvps.length === 0 ? "No RSVPs yet. They'll show up here as guests respond." : "No guests match that search."}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <table className="mt-5 hidden w-full text-left text-[14px] md:table">
            <thead>
              <tr className="border-b border-black/[0.06] text-[11.5px] font-semibold uppercase tracking-wide text-[var(--ink)]/45">
                <th className="py-3 pr-4 font-semibold">Guest</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 text-right font-semibold">Guests</th>
                <th className="py-3 pr-4 font-semibold">Message</th>
                <th className="py-3 text-right font-semibold">Responded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-black/[0.015]">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.guest_name} muted={!r.attending} />
                      <span className="font-semibold">{r.guest_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusPill attending={r.attending} />
                  </td>
                  <td className="py-3.5 pr-4 text-right tabular-nums">{r.attending ? r.guest_count ?? 1 : "—"}</td>
                  <td className="max-w-[280px] py-3.5 pr-4">
                    <p className="truncate text-[13px] text-[var(--ink)]/60" title={r.message ?? undefined}>
                      {r.message || <span className="opacity-40">—</span>}
                    </p>
                  </td>
                  <td className="py-3.5 text-right text-[13px] text-[var(--ink)]/50">{shortDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile stacked cards */}
          <ul className="mt-5 flex flex-col gap-2.5 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl border border-black/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.guest_name} muted={!r.attending} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.guest_name}</p>
                    <p className="text-[12px] text-[var(--ink)]/50">
                      {r.attending ? `${r.guest_count ?? 1} guest${(r.guest_count ?? 1) === 1 ? "" : "s"} · ` : ""}
                      {shortDate(r.created_at)}
                    </p>
                  </div>
                  <StatusPill attending={r.attending} />
                </div>
                {r.message && <p className="mt-2.5 text-[13px] italic text-[var(--ink)]/65">&ldquo;{r.message}&rdquo;</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
