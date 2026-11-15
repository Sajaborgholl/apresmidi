"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "@phosphor-icons/react";
import { setReplyDeadline } from "../actions";
import { Button, Card } from "./ui";

// The Invitation tab's "Reply deadline": an optional date after which the
// reply form closes and nothing more is sent. Guests see "Please reply by …"
// on their invitation until then.
export default function ReplyDeadlineCard({
  token,
  replyBy,
  maxDate,
  closedText,
}: {
  token: string;
  // Saved deadline, "YYYY-MM-DD", or null.
  replyBy: string | null;
  // The event's day ("YYYY-MM-DD"): the latest a deadline can be.
  maxDate: string | null;
  // "Replies closed on …" when the saved deadline is over, else null.
  closedText: string | null;
}) {
  const [value, setValue] = useState(replyBy ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Today in the host's own calendar, for the picker's lower limit.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function save(date: string | null) {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const r = await setReplyDeadline(token, date);
      if ("error" in r) return setError(r.error);
      if (!date) setValue("");
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card
      title="Reply deadline"
      description="Optional. Guests see “Please reply by …”, and replies close after that day."
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Reply by</span>
          <CalendarCheck size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="date"
            value={value}
            min={today}
            // "today" is the viewer's own date, which can differ from the server's.
            suppressHydrationWarning
            max={maxDate ?? undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className="rounded-full border border-black/[0.12] bg-white py-2 pl-9 pr-3.5 text-[14px] outline-none transition focus:border-[var(--blue-dark)]"
          />
        </label>
        <Button size="sm" variant="primary" disabled={pending || !value || value === replyBy} onClick={() => save(value)}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {replyBy && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => save(null)}>
            Remove
          </Button>
        )}
      </div>
      {closedText && <p className="mt-3 text-[13px] font-medium text-[var(--danger)]">{closedText}</p>}
      {error && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
      {saved && !error && <p className="mt-3 text-[13px] font-medium text-[var(--coming)]">Saved.</p>}
    </Card>
  );
}
