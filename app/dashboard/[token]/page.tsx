import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle, XCircle, UsersThree, Lock, Envelope, ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import AutoRefresh from "@/app/_components/AutoRefresh";
import CopyLinkButton from "@/app/_components/CopyLinkButton";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Reachable only by knowing the (long, random) dashboard_token — never
// intentionally linked to from anywhere crawlable, but keep it out of
// search indexes as defense in depth too.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id, host_names, slug, status")
    .eq("dashboard_token", token)
    .maybeSingle();

  // Defense in depth: token possession alone isn't sufficient — an invite
  // that isn't (or is no longer) 'live' must not show RSVP data just
  // because a dashboard_token happens to resolve to it.
  if (!invite || invite.status !== "live") notFound();

  const { data: rsvpRows } = await supabaseAdmin
    .from("rsvps")
    .select("id, guest_name, attending, guest_count, message, created_at")
    .eq("invite_id", invite.id)
    .order("created_at", { ascending: false });

  const rsvps = rsvpRows ?? [];
  const accepted = rsvps.filter((r) => r.attending);
  const declined = rsvps.filter((r) => !r.attending);
  const totalGuests = accepted.reduce((sum, r) => sum + (r.guest_count ?? 1), 0);
  const guestUrl = `${BASE_URL}/i/${invite.slug}`;

  return (
    <main
      className="mx-auto max-w-2xl px-6 py-16"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
    >
      {/* New responses land here as guests submit — re-runs this page's
          data fetch so the owner doesn't have to manually reload while
          checking in on RSVPs. Lighter interval than the payment poller
          (RSVPs trickle in far more slowly than a single payment event). */}
      <AutoRefresh intervalMs={15000} />

      <h1 className="display text-2xl font-bold">{invite.host_names}&apos;s RSVPs</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold shadow">
          <Lock size={12} weight="regular" />
          Private, only you have this link
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold shadow">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--blue-dark)" }} />
          Updating live
        </span>
      </div>

      <div className="mt-6">
        <CopyLinkButton label="Guest link" url={guestUrl} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: "var(--blue-light)", border: "1px solid var(--blue-dark)" }}
        >
          <CheckCircle size={18} weight="regular" className="mx-auto mb-1.5" style={{ color: "var(--blue-dark)" }} />
          <p className="display text-2xl font-bold">{accepted.length}</p>
          <p className="text-[12px] opacity-70">Accepted</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <XCircle size={18} weight="regular" className="mx-auto mb-1.5 opacity-60" style={{ color: "var(--ink)" }} />
          <p className="display text-2xl font-bold">{declined.length}</p>
          <p className="text-[12px] opacity-60">Declined</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <UsersThree size={18} weight="regular" className="mx-auto mb-1.5 opacity-60" style={{ color: "var(--ink)" }} />
          <p className="display text-2xl font-bold">{totalGuests}</p>
          <p className="text-[12px] opacity-60">Total guests</p>
        </div>
      </div>

      {rsvps.length === 0 ? (
        <div
          className="mt-8 flex flex-col items-center gap-3 rounded-2xl px-6 py-14 text-center"
          style={{ background: "#fff", border: "1px dashed rgba(0,0,0,0.15)" }}
        >
          <Envelope size={28} weight="regular" className="opacity-40" />
          <p className="opacity-60">No RSVPs yet. Share the guest link above to start getting responses.</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {accepted.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold opacity-60">Attending ({accepted.length})</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {accepted.map((r) => (
                  <li key={r.id} className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: "var(--blue)", border: "3px solid var(--blue-dark)", color: "var(--ink)" }}
                      >
                        {r.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{r.guest_name}</span>
                          <span className="shrink-0 text-xs opacity-45">{relativeTime(r.created_at)}</span>
                        </div>
                        <p className="text-sm opacity-60">{r.guest_count ?? 1} guest{(r.guest_count ?? 1) === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                    {r.message && (
                      <p className="mt-2 flex items-start gap-1.5 pl-[52px] text-sm italic opacity-70">
                        <ChatCircleText size={14} weight="regular" className="mt-0.5 shrink-0 opacity-60" />
                        {r.message}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {declined.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold opacity-60">Declined ({declined.length})</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {declined.map((r) => (
                  <li key={r.id} className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold opacity-60"
                        style={{ background: "rgba(31,36,48,0.06)", border: "2px solid rgba(31,36,48,0.2)", color: "var(--ink)" }}
                      >
                        {r.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold opacity-60">{r.guest_name}</span>
                          <span className="shrink-0 text-xs opacity-45">{relativeTime(r.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {r.message && (
                      <p className="mt-2 flex items-start gap-1.5 pl-[52px] text-sm italic opacity-70">
                        <ChatCircleText size={14} weight="regular" className="mt-0.5 shrink-0 opacity-60" />
                        {r.message}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
