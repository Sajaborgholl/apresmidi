import Link from "next/link";
import { Check, X, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { getDashboardInvite, getDashboardRsvps } from "../_lib/data";
import { summarizeRsvps, relativeTime } from "../_lib/format";
import { Card, CardHeader, StatRow, PageHeader, CountdownPill, EmptyState, OverviewActions } from "../_components/ui";
import SavedBanner from "../_components/SavedBanner";

type ActivityItem =
  | { kind: "rsvp"; id: string; at: string; name: string; attending: boolean; guests: number }
  | { kind: "published"; id: string; at: string };

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
  const rsvps = await getDashboardRsvps(invite.id);
  const { accepted, declined, headcount, total } = summarizeRsvps(rsvps);
  const plusOnes = headcount - accepted.length;
  const yesPct = total > 0 ? (accepted.length / total) * 100 : 0;
  const base = `/dashboard/${token}`;
  // How big each attending party is — the one thing the figures above don't
  // already say, and what a host actually needs for seating.
  const partySizes = [
    { label: "Just themselves", count: accepted.filter((r) => (r.guest_count ?? 1) === 1).length },
    { label: "Pairs", count: accepted.filter((r) => r.guest_count === 2).length },
    { label: "Groups of 3 or more", count: accepted.filter((r) => (r.guest_count ?? 1) >= 3).length },
  ];

  // "Invite published" is placed by its real date among the RSVPs rather
  // than pinned to the bottom, so the list is always in true date order.
  const activity: ActivityItem[] = [
    ...rsvps.map((r) => ({
      kind: "rsvp" as const,
      id: r.id,
      at: r.created_at,
      name: r.guest_name,
      attending: r.attending,
      guests: r.guest_count ?? 1,
    })),
    ...(invite.paid_at ? [{ kind: "published" as const, id: "published", at: invite.paid_at }] : []),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6);

  // Same UTC reading as formatEventDate: the stored time is what the host typed.
  const eventDay = invite.event_date
    ? new Date(invite.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })
    : null;
  const eventLine = [eventDay, invite.venue_name].filter(Boolean).join(" · ");

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
        actions={<OverviewActions token={token} />}
      />

      <StatRow
        stats={[
          {
            label: "People attending",
            value: headcount,
            hint: `${accepted.length} RSVP${accepted.length === 1 ? "" : "s"} + ${plusOnes} extra guest${plusOnes === 1 ? "" : "s"}`,
            info: "Everyone who's coming, counting each person. One RSVP can include extra guests (+1s), so this can be higher than the number of RSVPs.",
          },
          { label: "RSVPs received", value: total },
          { label: "Can't make it", value: declined.length },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.15fr]">
        <Card>
          <CardHeader title="Responses" />
          {total === 0 ? (
            <EmptyState icon={<ShareNetwork size={24} />} title="No RSVPs yet">
              <p>Share your guest link to start collecting responses.</p>
              <Link
                href={`${base}/share`}
                className="mt-4 inline-flex rounded-full px-4 py-2.5 text-[13px] font-semibold transition hover:opacity-90"
                style={{ background: "var(--ink)", color: "var(--cream)" }}
              >
                Share your invite
              </Link>
            </EmptyState>
          ) : (
            <>
              <div className="flex h-3 gap-1">
                {accepted.length > 0 && (
                  <div className="h-full rounded-full bg-[var(--blue-dark)]" style={{ width: `${yesPct}%` }} />
                )}
                {declined.length > 0 && <div className="h-full flex-1 rounded-full bg-black/[0.12]" />}
              </div>
              <div className="mt-3 flex justify-between text-[13px]">
                <span>
                  <strong className="font-semibold">{accepted.length}</strong> <span className="text-[var(--ink)]/55">yes</span>
                </span>
                <span>
                  <strong className="font-semibold">{declined.length}</strong> <span className="text-[var(--ink)]/55">no</span>
                </span>
              </div>

              {accepted.length > 0 && (
                <div className="mt-6 border-t border-black/[0.07] pt-4">
                  <p className="text-[13px] text-[var(--ink)]/55">Who&apos;s coming</p>
                  <ul className="mt-2 divide-y divide-black/[0.05]">
                    {partySizes.map((p) => (
                      <li key={p.label} className="flex items-center justify-between py-2.5 text-[14px]">
                        <span className="text-[var(--ink)]/75">{p.label}</span>
                        <span className="font-semibold tabular-nums">{p.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent activity" href={total > 0 ? `${base}/guests` : undefined} />
          <ol>
            {activity.map((item, i) => (
              <li key={item.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                {i < activity.length - 1 && (
                  <span className="absolute bottom-1 left-[13px] top-8 w-px bg-black/[0.08]" aria-hidden="true" />
                )}
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                  {item.kind === "published" ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--ink)]/30" />
                  ) : item.attending ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--blue-dark)] text-white">
                      <Check size={13} weight="bold" />
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black/15 bg-white text-[var(--ink)]/45">
                      <X size={12} weight="bold" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[14px] font-semibold">{item.kind === "published" ? "Invite published" : item.name}</p>
                    <span className="shrink-0 text-[11.5px] text-[var(--ink)]/40">{relativeTime(item.at)}</span>
                  </div>
                  <p className="text-[12.5px] text-[var(--ink)]/55">
                    {item.kind === "published"
                      ? "Your guest link went live"
                      : item.attending
                        ? `Attending · ${item.guests} ${item.guests === 1 ? "person" : "people"}`
                        : "Can't make it"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
