"use client";

import { useMemo, useState } from "react";
import { DownloadSimple, MagnifyingGlass } from "@phosphor-icons/react";
import type { DashboardRsvp } from "../_lib/format";
import { downloadCsv, sheetText } from "../_lib/csv";
import { Avatar, Button, EmptyState, ReplyBadge } from "./ui";
import { Segmented } from "./ui-client";

type Filter = "all" | "attending" | "declined";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Replies that came through the general link (no guest attached). Filtering,
// search and CSV export all run on the rows the server already loaded.
export default function GuestsTable({ rsvps, fileName }: { rsvps: DashboardRsvp[]; fileName: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter(
      (r) => (filter === "all" || (filter === "attending") === r.attending) && (!q || r.guest_name.toLowerCase().includes(q))
    );
  }, [rsvps, filter, query]);

  function exportCsv() {
    downloadCsv(
      fileName,
      ["Name", "Status", "Guests", "Message", "Responded"],
      rsvps.map((r) => [
        sheetText(r.guest_name),
        r.attending ? "Coming" : "Not coming",
        r.attending ? r.guest_count ?? 1 : 0,
        sheetText(r.message ?? ""),
        new Date(r.created_at).toISOString(),
      ])
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented<Filter>
          label="Filter earlier replies"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: rsvps.length },
            { value: "attending", label: "Coming", count: rsvps.filter((r) => r.attending).length },
            { value: "declined", label: "Not coming", count: rsvps.filter((r) => !r.attending).length },
          ]}
        />
        <div className="flex gap-2 md:ml-auto">
          <label className="relative flex-1 md:w-52 md:flex-none">
            <MagnifyingGlass size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search earlier replies"
              className="w-full rounded-full border border-black/[0.12] bg-white py-2 pl-9 pr-3.5 text-[14px] outline-none transition focus:border-[var(--blue-dark)]"
            />
          </label>
          <Button onClick={exportCsv} icon={<DownloadSimple size={15} />}>
            Export
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<MagnifyingGlass size={20} />} title="No replies match" />
      ) : (
        <ul className="mt-4 divide-y divide-[var(--line)]">
          {rows.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.guest_name} muted={!r.attending} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{r.guest_name}</p>
                  <p className="text-[12px] text-[var(--ink)]/65">{shortDate(r.created_at)}</p>
                </div>
                <ReplyBadge reply={r} />
              </div>
              {r.message && <p className="mt-2 pl-12 text-[13px] italic text-[var(--ink)]/65">&ldquo;{r.message}&rdquo;</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
