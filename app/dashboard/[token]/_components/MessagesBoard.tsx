"use client";

import { useState } from "react";
import type { DashboardRsvp } from "../_lib/format";
import { relativeTime } from "../_lib/format";
import { Avatar, ReplyBadge } from "./ui";
import { Segmented } from "./ui-client";

type Filter = "all" | "coming" | "declined";

// Guests' notes as a guestbook, filterable by their reply.
export default function MessagesBoard({ messages }: { messages: DashboardRsvp[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = messages.filter((r) => filter === "all" || (filter === "coming") === r.attending);
  const coming = messages.filter((r) => r.attending).length;

  return (
    <>
      <div className="mb-5">
        <Segmented<Filter>
          label="Filter notes"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: messages.length },
            { value: "coming", label: "Coming", count: coming },
            { value: "declined", label: "Not coming", count: messages.length - coming },
          ]}
        />
      </div>
      {/* CSS columns give it a masonry feel: notes vary a lot in length and a
          fixed grid would leave big gaps under short ones. */}
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {shown.map((r) => (
          <figure key={r.id} className="mb-4 break-inside-avoid rounded-[20px] border border-[var(--line)] bg-white p-5 sm:p-6">
            <blockquote className="text-[16px] leading-relaxed text-[var(--ink)]/85">&ldquo;{r.message}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-[var(--line)] pt-4">
              <Avatar name={r.guest_name} muted={!r.attending} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{r.guest_name}</p>
                <p className="text-[12px] text-[var(--ink)]/65">{relativeTime(r.created_at)}</p>
              </div>
              <ReplyBadge reply={r} />
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
