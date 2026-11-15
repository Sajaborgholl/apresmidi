import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowSquareOut,
  BellRinging,
  ChatCircleText,
  Check,
  CheckCircle,
  Eye,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { getDashboardGuests, getDashboardInvite, getDashboardRsvps, getEarlierRsvps } from "../_lib/data";
import { canRemind, notYetInvited, relativeTime, summarizeGuests } from "../_lib/format";
import { Avatar, Button, Card, CountdownPill, EmptyState, PageHeader, ProgressBar, ReplyBadge, StatTile } from "../_components/ui";
import SavedBanner from "../_components/SavedBanner";
import { eventDayPassed, formatReplyBy, replyDeadlinePassed } from "@/lib/calendar";

type ActivityItem = { id: string; at: string; icon: ReactNode; tone: string; title: string; detail: string };

export default async function DashboardOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { token } = await params;
  const { saved } = await searchParams;
  const invite = await getDashboardInvite(token);
  const [guests, earlier, rsvps] = await Promise.all([
    getDashboardGuests(invite.id),
    getEarlierRsvps(invite.id),
    getDashboardRsvps(invite.id),
  ]);
  const s = summarizeGuests(guests);
  const base = `/dashboard/${token}`;
  const notSent = guests.filter(notYetInvited);
  const remindable = guests.filter(canRemind);
  const invited = s.total - notSent.length;
  const replied = s.accepted.length + s.declined.length;
  const notes = rsvps.filter((r) => r.message).slice(0, 3);

  // Same UTC reading as formatEventDate: the stored time is what the host typed.
  const eventDay = invite.event_date
    ? new Date(invite.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })
    : null;
  const eventLine = [eventDay, invite.venue_name].filter(Boolean).join(" · ");

  // The one thing to do next, picked from where the guest list stands.
  // After the event there's nothing left to send (sending is blocked then):
  // point to what's worth keeping instead.
  const next = eventDayPassed(invite.event_date)
    ? {
        title: "Your event has passed",
        text: `${s.seatsConfirmed} seat${s.seatsConfirmed === 1 ? " was" : "s were"} confirmed. Your guest list and your guests' notes stay here.`,
        cta: "Read your guests' notes",
        href: `${base}/messages`,
        icon: <ArrowRight size={16} weight="bold" />,
      }
    : invite.reply_by && replyDeadlinePassed(invite.reply_by)
      ? {
          title: "Replies have closed",
          text: `Your deadline was ${formatReplyBy(invite.reply_by)}. ${s.seatsConfirmed} seat${s.seatsConfirmed === 1 ? " is" : "s are"} confirmed. You can move the deadline on the Invitation tab.`,
          cta: "Change the deadline",
          href: `${base}/invitation`,
          icon: <ArrowRight size={16} weight="bold" />,
        }
    : s.total === 0
      ? { title: "Add your guests", text: "Each guest gets a personal invitation with their name and the seats you reserve for them.", cta: "Add guests", href: `${base}/guests?add=1`, icon: <Plus size={16} weight="bold" /> }
      : notSent.length > 0
        ? {
            title: `Send your invitation${notSent.length === 1 ? "" : "s"}`,
            text: `${notSent.length} guest${notSent.length === 1 ? " hasn't" : "s haven't"} received their invitation yet. They'll get it on WhatsApp.`,
            cta: `Send to ${notSent.length}`,
            href: `${base}/guests?send=invite`,
            icon: <PaperPlaneTilt size={16} weight="bold" />,
          }
        : remindable.length > 0
          ? {
              title: `${remindable.length} guest${remindable.length === 1 ? " hasn't" : "s haven't"} replied`,
              text: "Send a gentle reminder on WhatsApp. Each guest gets at most one a day.",
              cta: "Send reminders",
              href: `${base}/guests?send=reminder`,
              icon: <BellRinging size={16} weight="bold" />,
            }
          : s.waiting.length > 0
            ? { title: "Waiting for replies", text: `${s.waiting.length} guest${s.waiting.length === 1 ? " hasn't" : "s haven't"} replied yet. Replies appear here as they come in.`, cta: "See guests", href: `${base}/guests`, icon: <ArrowRight size={16} weight="bold" /> }
            : { title: "Everyone has replied", text: `${s.seatsConfirmed} seat${s.seatsConfirmed === 1 ? "" : "s"} confirmed. You can export the list from the Guests page.`, cta: "See guest list", href: `${base}/guests`, icon: <ArrowRight size={16} weight="bold" /> };

  const steps = [
    { label: "Add your guests", detail: s.total ? `${s.total} guest${s.total === 1 ? "" : "s"}` : "Not started", done: s.total > 0 },
    { label: "Send invitations", detail: s.total ? `${invited} of ${s.total} sent` : "—", done: s.total > 0 && notSent.length === 0 },
    { label: "Collect replies", detail: s.total ? `${replied} of ${s.total} replied` : "—", done: s.total > 0 && replied === s.total },
  ];
  const current = steps.findIndex((st) => !st.done);

  const activity: ActivityItem[] = [
    ...guests.flatMap((g) => {
      const items: ActivityItem[] = [];
      if (g.reply) {
        items.push({
          id: `${g.id}-reply`,
          at: g.reply.replied_at,
          icon: g.reply.attending ? <Check size={13} weight="bold" /> : <X size={12} weight="bold" />,
          tone: g.reply.attending ? "bg-[var(--coming-soft)] text-[var(--coming)]" : "bg-black/[0.05] text-[var(--ink)]/65",
          title: g.name,
          detail: g.reply.attending
            ? `${g.reply.changed ? "Changed their reply: coming" : "Is coming"} · ${g.reply.guest_count} ${g.reply.guest_count === 1 ? "person" : "people"}`
            : g.reply.changed
              ? "Changed their reply: can't make it"
              : "Can't make it",
        });
      }
      if (g.first_opened_at && !g.reply) {
        items.push({ id: `${g.id}-open`, at: g.first_opened_at, icon: <Eye size={13} />, tone: "bg-[var(--blue)]/30 text-[var(--ink)]/70", title: g.name, detail: "Opened their invitation" });
      }
      if (g.delivery?.status === "failed") {
        items.push({
          id: `${g.id}-failed`,
          at: g.delivery.at,
          icon: <WarningCircle size={14} weight="bold" />,
          tone: "bg-[var(--danger-soft)] text-[var(--danger)]",
          title: g.name,
          detail: `${g.delivery.kind === "reminder" ? "Reminder" : "Invitation"} couldn't be delivered`,
        });
      }
      return items;
    }),
    ...earlier.map((r) => ({
      id: r.id,
      at: r.created_at,
      icon: r.attending ? <Check size={13} weight="bold" /> : <X size={12} weight="bold" />,
      tone: r.attending ? "bg-[var(--coming-soft)] text-[var(--coming)]" : "bg-black/[0.05] text-[var(--ink)]/65",
      title: r.guest_name,
      detail: r.attending ? `Is coming · ${r.guest_count ?? 1}` : "Can't make it",
    })),
    ...(invite.paid_at
      ? [{ id: "published", at: invite.paid_at, icon: <Sparkle size={13} weight="fill" />, tone: "bg-[var(--ink)] text-[var(--cream)]", title: "Invitation published", detail: "Your invitation went live" }]
      : []),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7);

  return (
    <>
      {saved === "1" && <SavedBanner />}

      <PageHeader
        title={invite.host_names}
        subtitle={
          eventLine ? (
            <>
              <span>{eventLine}</span>
              <CountdownPill eventDate={invite.event_date} />
            </>
          ) : undefined
        }
        actions={
          <>
            {/* Secondary on purpose: the "Next step" card below holds this
                page's one primary action. */}
            <Button href={`/i/${invite.slug}`} external variant="ghost" icon={<ArrowSquareOut size={15} />}>
              View invitation
            </Button>
            <Button href={`${base}/edit`} icon={<PencilSimple size={15} />}>
              Edit invitation
            </Button>
          </>
        }
      />

      {/* ---------- Next step ---------- */}
      <section className="overflow-hidden rounded-[24px] bg-[var(--ink)] text-[var(--cream)]">
        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center md:gap-10">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--cream)]/55">Next step</p>
            <h2 className="display mt-2 text-[22px] font-bold leading-tight sm:text-[26px]">{next.title}</h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--cream)]/70">{next.text}</p>
            <Button href={next.href} icon={next.icon} variant="light" className="mt-5">
              {next.cta}
            </Button>
          </div>
          <ol className="flex flex-col gap-1 rounded-2xl bg-white/[0.06] p-2">
            {steps.map((st, i) => (
              <li
                key={st.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === current ? "bg-white/[0.08]" : ""}`}
                aria-current={i === current ? "step" : undefined}
              >
                {st.done ? (
                  <CheckCircle size={22} weight="fill" className="shrink-0 text-[var(--blue)]" />
                ) : (
                  <span
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[12px] font-bold ${
                      i === current ? "border-[var(--cream)] text-[var(--cream)]" : "border-[var(--cream)]/30 text-[var(--cream)]/60"
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
                <span className={`flex-1 text-[14px] font-semibold ${st.done || i === current ? "" : "text-[var(--cream)]/60"}`}>{st.label}</span>
                <span className="text-[13px] tabular-nums text-[var(--cream)]/55">{st.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Figures ---------- */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Seats confirmed"
          value={s.seatsConfirmed}
          suffix={`of ${s.seatsInvited}`}
          info="Everyone who's coming, counting each person. Each guest can confirm up to the seats you reserved for them."
        >
          <ProgressBar value={s.seatsConfirmed} max={s.seatsInvited} label="Seats confirmed" />
        </StatTile>
        <StatTile label="Coming" value={s.accepted.length} hint={s.accepted.length === 1 ? "guest" : "guests"} />
        <StatTile label="Not coming" value={s.declined.length} hint={s.declined.length === 1 ? "guest" : "guests"} />
        <StatTile
          label="Waiting for a reply"
          value={s.waiting.length}
          hint={
            s.notSent.length > 0
              ? `+ ${s.notSent.length} not sent yet`
              : s.waiting.length === 1
                ? "guest"
                : "guests"
          }
        />
      </div>

      {/* ---------- Activity + notes ---------- */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card title="Recent activity" action={s.total > 0 ? <Button href={`${base}/guests`} variant="ghost" size="sm">See guests</Button> : undefined}>
          {activity.length === 0 ? (
            <EmptyState icon={<Eye size={22} />} title="No activity yet">
              Replies, opened invitations and delivery problems will show up here.
            </EmptyState>
          ) : (
            <ol className="flex flex-col">
              {activity.map((item, i) => (
                <li key={item.id} className="relative flex gap-3.5 pb-4 last:pb-0">
                  {i < activity.length - 1 && <span className="absolute bottom-0 left-[13.5px] top-8 w-px bg-[var(--line)]" aria-hidden="true" />}
                  <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.tone}`}>{item.icon}</span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[14px] font-semibold">{item.title}</p>
                      <span className="shrink-0 text-[12px] text-[var(--ink)]/65">{relativeTime(item.at)}</span>
                    </div>
                    <p className="text-[13px] text-[var(--ink)]/65">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Latest notes" action={notes.length > 0 ? <Button href={`${base}/messages`} variant="ghost" size="sm">See all</Button> : undefined}>
          {notes.length === 0 ? (
            <EmptyState icon={<ChatCircleText size={22} />} title="No notes yet">
              Messages guests add to their reply show up here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {notes.map((r) => (
                <li key={r.id} className="rounded-2xl bg-[var(--cream)] p-4">
                  <p className="line-clamp-3 text-[14px] leading-relaxed text-[var(--ink)]/85">&ldquo;{r.message}&rdquo;</p>
                  <div className="mt-3 flex items-center gap-2.5">
                    <Avatar name={r.guest_name} size="sm" muted={!r.attending} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{r.guest_name}</span>
                    <ReplyBadge reply={r} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
