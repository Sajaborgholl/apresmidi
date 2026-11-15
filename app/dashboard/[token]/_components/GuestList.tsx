"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowSquareOut,
  BellRinging,
  ChatCircleText,
  Check,
  Checks,
  Copy,
  DownloadSimple,
  MagnifyingGlass,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  StopCircle,
  Trash,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { formatPhone } from "@/lib/guestRules";
import { deleteGuest, deleteGuests, updateGuest } from "../guestActions";
import { canRemind, notYetInvited, relativeTime, type DashboardGuest, type SendingState } from "../_lib/format";
import { downloadCsv, sheetText } from "../_lib/csv";
import AddGuestsSheet from "./AddGuestsSheet";
import GuestForm from "./GuestForm";
import SendSheet, { ConsentSheet, type SendMode } from "./SendSheet";
import { Avatar, Badge, Button, EmptyState, PageHeader, ReplyBadge } from "./ui";
import { Menu, Segmented, Sheet, ToastView, useConfirm, useToast, type MenuItem } from "./ui-client";
import { useSender } from "./useSender";

type Filter = "all" | "notsent" | "waiting" | "coming" | "declined";
type Sort = "added" | "name" | "reply";

// Why a WhatsApp message didn't arrive, in words a host can act on. Meta's
// raw reason is kept in the badge's tooltip; these cover the usual codes.
function deliveryHint(error: string | null): string {
  if (error?.includes("131026")) return "This number may not be on WhatsApp. Check it, or copy their link and send it yourself.";
  if (error?.includes("131049")) return "WhatsApp held it back to avoid sending too much. Try again tomorrow.";
  return "WhatsApp couldn't deliver it. Check the number, or copy their link and send it yourself.";
}
export type OpenSheet = "add" | SendMode | null;

// Where a guest's WhatsApp invitation stands, as one badge. Outlined, with
// WhatsApp's own ticks, so it never looks like the (filled) reply badge.
function DeliveryBadge({ guest }: { guest: DashboardGuest }) {
  const d = guest.delivery;
  if (!d) return <Badge tone="outline">Not sent</Badge>;
  const what = d.kind === "reminder" ? "Reminder" : "Invite";
  switch (d.status) {
    case "queued":
    case "sending":
      return <Badge tone="info">Sending…</Badge>;
    case "cancelled":
      return <Badge tone="outline">Stopped</Badge>;
    case "failed":
      // The raw reason (from Meta) is for us, not the host: it stays in the tooltip.
      return (
        <Badge tone="danger" icon={<WarningCircle size={12} weight="bold" />} title={d.error ?? undefined}>
          Not delivered
        </Badge>
      );
    case "read":
      return (
        <Badge tone="outline" icon={<Checks size={13} weight="bold" className="text-[var(--blue-dark)]" />}>
          {what} read
        </Badge>
      );
    case "delivered":
      return (
        <Badge tone="outline" icon={<Checks size={13} weight="bold" />}>
          {what} delivered
        </Badge>
      );
    default:
      return (
        <Badge tone="outline" icon={<Check size={12} weight="bold" />}>
          {what} sent
        </Badge>
      );
  }
}

// Which filter tab a guest falls under.
function status(g: DashboardGuest): Filter {
  return g.reply ? (g.reply.attending ? "coming" : "declined") : notYetInvited(g) ? "notsent" : "waiting";
}

function activityLine(g: DashboardGuest) {
  if (g.reply) return `${g.reply.changed ? "Changed" : "Replied"} ${relativeTime(g.reply.replied_at)}`;
  if (g.first_opened_at) return `Opened ${relativeTime(g.last_opened_at ?? g.first_opened_at)}`;
  if (g.delivery && g.delivery.status !== "failed" && g.delivery.status !== "cancelled") return `Sent ${relativeTime(g.delivery.at)}`;
  return `Added ${relativeTime(g.created_at)}`;
}

export default function GuestList({
  token,
  guests,
  linkBase,
  fileName,
  sending,
  event,
  subtitle,
  initialSheet,
}: {
  token: string;
  guests: DashboardGuest[];
  // `${site}/i/${slug}/g/` — a guest's link is this plus their token.
  linkBase: string;
  fileName: string;
  sending: SendingState;
  event: { hostNames: string; category: string | null; eventDate: string | null };
  subtitle: ReactNode;
  // From ?add=1 / ?send=… links on the Overview.
  initialSheet: OpenSheet;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<OpenSheet>(initialSheet);
  const [editing, setEditing] = useState<DashboardGuest | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("added");
  const { toast, show: say, dismiss } = useToast();
  const { confirm, element: confirmElement } = useConfirm();
  const sender = useSender(token, say, () => setSelected(new Set()), confirm);
  const [, startTransition] = useTransition();
  const router = useRouter();
  // "View" opens the guest's page on this same site (just the path), so it
  // works wherever the dashboard runs; copied links keep the public address.
  const viewBase = new URL(linkBase).pathname;

  // The ?add / ?send link did its job once the panel is open: drop it so a
  // reload doesn't reopen the panel.
  useEffect(() => {
    if (initialSheet) window.history.replaceState(null, "", window.location.pathname);
  }, [initialSheet]);

  const counts = useMemo(() => {
    const c = { all: guests.length, notsent: 0, waiting: 0, coming: 0, declined: 0 };
    for (const g of guests) c[status(g)]++;
    return c;
  }, [guests]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const shown = guests.filter((g) => {
      const matches = !q || g.name.toLowerCase().includes(q) || (qDigits !== "" && g.phone.includes(qDigits));
      return (filter === "all" || filter === status(g)) && matches;
    });
    // "added" keeps the server's order (oldest first).
    if (sort === "name") return [...shown].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "reply") {
      const at = (g: DashboardGuest) => (g.reply ? new Date(g.reply.replied_at).getTime() : 0);
      return [...shown].sort((a, b) => at(b) - at(a));
    }
    return shown;
  }, [guests, filter, query, sort]);

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
      say(`${g.name}'s personal link was copied.`);
    } catch {
      say("Couldn't copy: your browser blocked it.", true);
    }
  }

  async function remove(g: DashboardGuest) {
    const ok = await confirm({
      title: `Remove ${g.name}?`,
      text: "Their personal link will stop working, and any message still waiting to go out is stopped.",
      confirmLabel: "Remove guest",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteGuest(token, g.id);
      say("error" in r ? r.error : `${g.name} was removed.`, "error" in r);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(g.id);
        return next;
      });
    });
  }

  async function removeSelected() {
    const ids = [...selected];
    const ok = await confirm({
      title: `Remove ${ids.length} guest${ids.length === 1 ? "" : "s"}?`,
      text: "Their personal links will stop working, and any messages still waiting to go out are stopped.",
      confirmLabel: `Remove ${ids.length}`,
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteGuests(token, ids);
      if ("error" in r) return say(r.error, true);
      say(`${r.removed} guest${r.removed === 1 ? " was" : "s were"} removed.`);
      setSelected(new Set());
    });
  }

  // The whole list, or just the ticked guests (the selection bar).
  function exportCsv(list: DashboardGuest[] = guests) {
    downloadCsv(
      fileName,
      ["Name", "WhatsApp", "Seats", "Reply", "Coming", "Message", "Opened", "Personal link"],
      list.map((g) => [
        sheetText(g.name),
        formatPhone(g.phone),
        g.seats,
        !g.reply ? "Waiting" : g.reply.attending ? "Coming" : "Not coming",
        g.reply?.attending ? g.reply.guest_count : 0,
        sheetText(g.reply?.message ?? ""),
        g.first_opened_at ? new Date(g.first_opened_at).toISOString() : "",
        linkBase + g.token,
      ])
    );
  }

  const paused = sending.pending > 0 && sending.whatsapp.startsWith("paused");
  const selectedGuests = guests.filter((g) => selected.has(g.id));
  const selectedRemindable = selectedGuests.filter(canRemind).length;

  // The one action that fits where this guest stands; the rest are in "⋯".
  function rowAction(g: DashboardGuest) {
    const d = g.delivery;
    if (d && (d.status === "queued" || d.status === "sending")) return null;
    if (notYetInvited(g)) {
      const send = (
        <Button size="sm" variant="secondary" disabled={sender.pending} onClick={() => sender.send([g.id])} icon={<PaperPlaneTilt size={14} />}>
          {d?.status === "failed" ? "Retry" : "Send"}
        </Button>
      );
      // Didn't arrive: the host can also send the link themselves.
      if (d?.status !== "failed") return send;
      return (
        <span className="inline-flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => copyLink(g)} icon={<Copy size={14} />}>
            Copy link
          </Button>
          {send}
        </span>
      );
    }
    if (canRemind(g)) {
      return (
        <Button size="sm" variant="ghost" disabled={sender.pending} onClick={() => sender.remind([g.id])} icon={<BellRinging size={14} />}>
          Remind
        </Button>
      );
    }
    return null;
  }

  function menuItems(g: DashboardGuest): MenuItem[] {
    // "?host=1" so the host looking doesn't count as the guest opening it.
    const items: MenuItem[] = [
      { label: "View their invitation", icon: <ArrowSquareOut size={16} />, href: `${viewBase}${g.token}?host=1` },
      { label: "Copy personal link", icon: <Copy size={16} />, onSelect: () => copyLink(g) },
    ];
    if (!notYetInvited(g) && g.delivery?.status !== "queued" && g.delivery?.status !== "sending") {
      items.push({ label: "Send invitation again", icon: <PaperPlaneTilt size={16} />, onSelect: () => sender.send([g.id]) });
    }
    items.push(
      { label: "Edit guest", icon: <PencilSimple size={16} />, onSelect: () => setEditing(g) },
      { label: "Remove guest", icon: <Trash size={16} />, onSelect: () => remove(g), danger: true }
    );
    return items;
  }

  return (
    <>
      <PageHeader
        title="Guests"
        subtitle={subtitle}
        actions={
          <>
            <Button onClick={() => setSheet("add")} icon={<Plus size={15} weight="bold" />}>
              Add guests
            </Button>
            <Button variant="primary" onClick={() => setSheet("invite")} disabled={guests.length === 0} icon={<PaperPlaneTilt size={15} />}>
              Send on WhatsApp
            </Button>
          </>
        }
      />

      {sending.pending > 0 && (
        <div
          role="status"
          className={`mb-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-[14px] ${
            paused ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--coming-soft)] text-[var(--coming)]"
          }`}
        >
          {paused ? <WarningCircle size={18} weight="bold" /> : <span className="h-2 w-2 animate-pulse rounded-full bg-current" />}
          <span className="mr-auto font-medium">
            {paused
              ? `Sending is paused on our side for a moment. ${sending.pending} message${sending.pending === 1 ? "" : "s"} will go out automatically once it's resolved. We've been alerted.`
              : `Sending… ${sending.pending} message${sending.pending === 1 ? "" : "s"} left. They go out one by one.`}
          </span>
          <Button size="sm" onClick={sender.stop} disabled={sender.pending} icon={<StopCircle size={14} />}>
            Stop sending
          </Button>
        </div>
      )}

      <section className="rounded-[20px] border border-[var(--line)] bg-white">
        {/* ---------- Toolbar ---------- */}
        {guests.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5 md:flex-row md:items-center">
            <Segmented<Filter>
              label="Filter guests"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "notsent", label: "Not sent", count: counts.notsent },
                { value: "waiting", label: "Waiting", count: counts.waiting },
                { value: "coming", label: "Coming", count: counts.coming },
                { value: "declined", label: "Not coming", count: counts.declined },
              ]}
            />
            {/* Phones: search on its own row, sort and Export below it. */}
            <div className="flex flex-wrap items-center gap-1.5 md:ml-auto md:flex-nowrap">
              <label className="relative w-full md:w-56">
                <MagnifyingGlass size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or number"
                  aria-label="Search guests"
                  className="w-full rounded-full border border-black/[0.12] bg-white py-2 pl-9 pr-3.5 text-[14px] outline-none transition focus:border-[var(--blue-dark)]"
                />
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="Sort guests"
                className="rounded-full border border-black/[0.12] bg-white py-2 pl-3 pr-2 text-[13px] font-medium outline-none transition focus:border-[var(--blue-dark)]"
              >
                <option value="added">Order added</option>
                <option value="name">Name A–Z</option>
                <option value="reply">Latest reply</option>
              </select>
              <Button size="sm" onClick={() => exportCsv()} icon={<DownloadSimple size={14} />}>
                Export
              </Button>
            </div>
            {/* Phones have no column header row, so "select all" lives here. */}
            {rows.length > 0 && (
              <label className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--ink)]/70 md:hidden">
                <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} className="h-4 w-4 accent-[var(--ink)]" />
                {filter !== "all" || query ? `Select all shown (${rows.length})` : `Select all (${rows.length})`}
              </label>
            )}
          </div>
        )}

        {/* ---------- Column titles (desktop) ---------- */}
        {rows.length > 0 && (
          <div className="hidden grid-cols-[20px_minmax(0,1.8fr)_56px_minmax(0,1fr)_minmax(0,1fr)_132px] items-center gap-4 border-b border-[var(--line)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--ink)]/65 md:grid">
            <input
              type="checkbox"
              checked={allShownSelected}
              onChange={toggleAllShown}
              className="h-4 w-4 accent-[var(--ink)]"
              aria-label={filter !== "all" || query ? "Select all shown" : "Select all"}
            />
            <span>Guest</span>
            <span className="text-center">Seats</span>
            <span>Invitation</span>
            <span>Reply</span>
            <span className="sr-only">Actions</span>
          </div>
        )}

        {/* ---------- Rows ---------- */}
        {guests.length === 0 ? (
          <EmptyState
            icon={<UsersThree size={22} />}
            title="No guests yet"
            action={
              <Button variant="primary" onClick={() => setSheet("add")} icon={<Plus size={15} weight="bold" />}>
                Add your first guest
              </Button>
            }
          >
            Add guests one by one or import a spreadsheet. Each gets a personal invitation with their name and seats.
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState icon={<MagnifyingGlass size={20} />} title="No guests match">
            Try another filter or search.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {rows.map((g) => {
              const declined = Boolean(g.reply && !g.reply.attending);
              const failed = g.delivery?.status === "failed";
              const note = g.reply?.message;
              return (
                <li key={g.id} className={`px-4 py-3 transition sm:px-5 ${selected.has(g.id) ? "bg-[var(--blue)]/[0.12]" : "hover:bg-black/[0.025]"}`}>
                  <div className="flex items-center gap-3 md:grid md:grid-cols-[20px_minmax(0,1.8fr)_56px_minmax(0,1fr)_minmax(0,1fr)_132px] md:gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(g.id)}
                      onChange={() => toggle(g.id)}
                      className="h-4 w-4 shrink-0 accent-[var(--ink)]"
                      aria-label={`Select ${g.name}`}
                    />

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={g.name} muted={declined} />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">{g.name}</p>
                        <p className="truncate text-[13px] tabular-nums text-[var(--ink)]/65">
                          {formatPhone(g.phone)}
                          <span className="md:hidden">
                            {" "}
                            · {g.seats} seat{g.seats === 1 ? "" : "s"}
                          </span>
                        </p>
                        {/* Phones: the two statuses under the name. */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
                          <DeliveryBadge guest={g} />
                          {status(g) !== "notsent" && <ReplyBadge reply={g.reply} />}
                          {note && (
                            <button type="button" onClick={() => setOpenNote(openNote === g.id ? null : g.id)} aria-label={`Read ${g.name}'s note`} className="text-[var(--blue-dark)]">
                              <ChatCircleText size={16} weight="fill" />
                            </button>
                          )}
                        </div>
                        {failed && (
                          <p className="mt-1 text-[12px] leading-snug text-[var(--danger)] md:hidden">{deliveryHint(g.delivery?.error ?? null)}</p>
                        )}
                      </div>
                    </div>

                    <span className="hidden text-center text-[14px] font-semibold tabular-nums md:block">{g.seats}</span>

                    <div className="hidden min-w-0 flex-col items-start gap-1 md:flex">
                      <DeliveryBadge guest={g} />
                      {failed ? (
                        <span className="text-[12px] leading-snug text-[var(--danger)]">{deliveryHint(g.delivery?.error ?? null)}</span>
                      ) : (
                        <span className="truncate text-[12px] text-[var(--ink)]/65">{activityLine(g)}</span>
                      )}
                    </div>

                    <div className="hidden min-w-0 items-center gap-1.5 md:flex">
                      {/* Nothing to wait for until their invitation is out. */}
                      {status(g) === "notsent" ? <span className="text-[13px] text-[var(--ink)]/30">—</span> : <ReplyBadge reply={g.reply} />}
                      {note && (
                        <button
                          type="button"
                          onClick={() => setOpenNote(openNote === g.id ? null : g.id)}
                          aria-expanded={openNote === g.id}
                          aria-label={`Read ${g.name}'s note`}
                          title="Read their note"
                          className="rounded-full p-1 text-[var(--blue-dark)] transition hover:bg-[var(--blue)]/25"
                        >
                          <ChatCircleText size={17} weight="fill" />
                        </button>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1">
                      <span className="hidden sm:inline-flex">{rowAction(g)}</span>
                      <Menu label={`Actions for ${g.name}`} items={menuItems(g)} />
                    </div>
                  </div>

                  {/* Phones: the action button gets its own line. */}
                  {rowAction(g) && <div className="mt-2.5 flex pl-[60px] sm:hidden">{rowAction(g)}</div>}

                  {note && openNote === g.id && (
                    <p className="dash-rise mt-3 rounded-2xl bg-[var(--cream)] px-4 py-3 text-[14px] leading-relaxed text-[var(--ink)]/80 md:ml-[68px]">
                      &ldquo;{note}&rdquo;
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------- Selection bar ---------- */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6 lg:pl-[264px]">
          <div className="dash-rise flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-[var(--ink)] py-1.5 pl-4 pr-1.5 text-[var(--cream)] shadow-[0_16px_48px_rgba(28,24,19,0.3)]">
            <span className="whitespace-nowrap pr-2 text-[14px] font-semibold tabular-nums">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => setSheet("selected")}
              disabled={sender.pending}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--cream)] px-3.5 text-[13px] font-semibold text-[var(--ink)] transition hover:bg-white disabled:opacity-50"
            >
              <PaperPlaneTilt size={14} />
              Send invitation
            </button>
            {selectedRemindable > 0 && (
              <button
                type="button"
                onClick={() => sender.remind([...selected])}
                disabled={sender.pending}
                className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-[var(--cream)] transition hover:bg-white/10 disabled:opacity-50"
              >
                <BellRinging size={14} />
                Remind {selectedRemindable}
              </button>
            )}
            <button
              type="button"
              onClick={() => exportCsv(selectedGuests)}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-[var(--cream)] transition hover:bg-white/10"
            >
              <DownloadSimple size={14} />
              Export
            </button>
            <button
              type="button"
              onClick={removeSelected}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-[#F4B4AE] transition hover:bg-white/10"
            >
              <Trash size={14} />
              Remove
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ---------- Panels ---------- */}
      {sheet === "add" && <AddGuestsSheet open onClose={() => setSheet(null)} token={token} say={say} />}
      {sheet !== null && sheet !== "add" && (
        <SendSheet
          key={sheet}
          open
          onClose={() => setSheet(null)}
          initialMode={sheet === "selected" && selected.size === 0 ? "invite" : sheet}
          sender={sender}
          guests={guests}
          selected={selected}
          event={event}
          linkBase={linkBase}
        />
      )}
      <ConsentSheet sender={sender} />
      {confirmElement}
      {editing && (
        <Sheet open onClose={() => setEditing(null)} title="Edit guest" description="Changes apply to their personal invitation right away.">
          <GuestForm
            initial={editing}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={async (next) => {
              const r = await updateGuest(token, editing.id, next);
              if ("error" in r) return r.error;
              // The panel closes before the action's own refresh lands, so ask
              // for the updated list explicitly.
              router.refresh();
              setEditing(null);
              say(r.note ?? `${next.name} was updated.`);
              return null;
            }}
          />
        </Sheet>
      )}

      <ToastView toast={toast} onDismiss={dismiss} raised={selected.size > 0} />
    </>
  );
}
