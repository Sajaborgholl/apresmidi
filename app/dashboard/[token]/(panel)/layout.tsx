import type { Metadata } from "next";
import type { ReactNode } from "react";
import AutoRefresh from "@/app/_components/AutoRefresh";
import Sidebar from "../_components/Sidebar";
import { getDashboardInvite, getDashboardRsvps } from "../_lib/data";

// Reachable only by knowing the (long, random) dashboard_token — never
// intentionally linked to from anywhere crawlable, but keep it out of
// search indexes as defense in depth too.
export const metadata: Metadata = {
  title: "Your dashboard — Après-midi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Shared shell for every dashboard section except the full-screen edit
// screen (app/dashboard/[token]/edit), which sits outside this route group.
export default async function DashboardPanelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const rsvps = await getDashboardRsvps(invite.id);

  return (
    <div
      // overflow-x-clip: InfoTip popovers stay in the layout while hidden (so
      // they can fade out), and one near the right edge must never widen the
      // page. clip, unlike hidden, keeps the sticky sidebar/top bar working.
      className="flex min-h-dvh flex-col overflow-x-clip lg:flex-row"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
    >
      {/* New responses land here as guests submit — re-runs every section's
          data fetch so the owner doesn't have to manually reload while
          checking in on RSVPs. */}
      <AutoRefresh intervalMs={15000} />
      <Sidebar
        token={token}
        hostNames={invite.host_names}
        templateName={invite.template?.name ?? null}
        messageCount={rsvps.filter((r) => r.message).length}
      />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 md:px-10 lg:py-10">
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>
    </div>
  );
}
