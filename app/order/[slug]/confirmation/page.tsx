import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import AutoRefresh from "../../../_components/AutoRefresh";
import CopyLinkButton from "../../../_components/CopyLinkButton";
import { confirmInvitePayment, startWhishPayment } from "../actions";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invite?: string; result?: string }>;
}) {
  const { slug: templateSlug } = await params;
  const { invite: inviteSlug, result } = await searchParams;

  if (!inviteSlug) notFound();

  const supabaseAdmin = getSupabaseAdmin();
  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("host_names, status, slug, dashboard_token")
    .eq("slug", inviteSlug)
    .single();

  if (!invite) notFound();

  // Not paid yet — auto-refresh so this naturally flips to the paid view
  // below once app/api/whish/callback/route.ts confirms payment.
  if (invite.status !== "live") {
    return (
      <main
        className="mx-auto max-w-lg px-6 py-16 text-center"
        style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)" }}
      >
        <AutoRefresh />
        <CheckCircle size={40} weight="fill" className="mx-auto mb-4" style={{ color: "var(--blue-dark)" }} />
        <h1 className="display text-2xl font-bold">Almost there, {invite.host_names}!</h1>
        <p className="mt-3 opacity-70">
          Your invite details are saved. It&apos;ll go live at your link as
          soon as payment is completed below.
        </p>

        {result === "failure" && (
          <p className="mt-4 text-sm font-medium" style={{ color: "#B45454" }}>
            Payment didn&apos;t go through. You can try again below.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            const collectUrl = await startWhishPayment(templateSlug, inviteSlug);
            redirect(collectUrl);
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="w-full rounded-full px-5 py-3 font-medium transition active:scale-[0.98]"
            style={{ background: "var(--blue-dark)", color: "var(--cream)" }}
          >
            Pay with Whish — $80
          </button>
        </form>

        {/* Dev-only: statically stripped from production builds by the
            NODE_ENV check, since Next.js replaces process.env.NODE_ENV at
            build time. Whish rejects localhost callback/redirect URLs
            outright, so the real "Pay with Whish" button above can't be
            exercised end-to-end locally — this stays the way to walk the
            paid path in local dev. Never a real payment trigger. */}
        {process.env.NODE_ENV !== "production" && (
          <form
            action={async () => {
              "use server";
              await confirmInvitePayment(inviteSlug);
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className="w-full rounded-full px-5 py-3 text-sm font-medium transition active:scale-[0.98]"
              style={{ background: "var(--yellow-dark)", color: "var(--ink)" }}
            >
              Simulate payment success (dev only)
            </button>
          </form>
        )}
      </main>
    );
  }

  const guestUrl = `${BASE_URL}/i/${invite.slug}`;
  const dashboardUrl = `${BASE_URL}/dashboard/${invite.dashboard_token}`;

  return (
    <main
      className="mx-auto max-w-lg px-6 py-16 text-center"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)" }}
    >
      <CheckCircle size={40} weight="fill" className="mx-auto mb-4" style={{ color: "var(--blue-dark)" }} />
      <h1 className="display text-2xl font-bold">You&apos;re all set, {invite.host_names}!</h1>
      <p className="mt-3 opacity-70">
        Your invite is live. Save both links below, we also emailed them to you.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <CopyLinkButton label="Guest link" url={guestUrl} />
        <CopyLinkButton label="Dashboard link" url={dashboardUrl} isPrivate />
      </div>
    </main>
  );
}
