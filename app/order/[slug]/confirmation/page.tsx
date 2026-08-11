import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import AutoRefresh from "../../../_components/AutoRefresh";
import CopyLinkButton from "../../../_components/CopyLinkButton";
import { confirmInvitePayment } from "../actions";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite: inviteSlug } = await searchParams;

  if (!inviteSlug) notFound();

  const supabaseAdmin = getSupabaseAdmin();
  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("host_names, status, slug, dashboard_token")
    .eq("slug", inviteSlug)
    .single();

  if (!invite) notFound();

  // Not paid yet — keep the existing "waiting on Whish" messaging, but
  // auto-refresh so this naturally flips to the paid view below once a
  // webhook (built separately) calls confirmInvitePayment.
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

        {/* Stubbed until Whish/Tap API keys are wired in. Swap this for
            the real payment button once that's ready. */}
        <button
          disabled
          className="mt-8 w-full cursor-not-allowed rounded-full px-5 py-3 font-medium"
          style={{ background: "rgba(31,36,48,0.08)", color: "var(--ink)", opacity: 0.5 }}
        >
          Pay with Whish (coming soon)
        </button>
        <p className="mt-2 text-xs opacity-45">
          We&apos;re finishing payment setup. We&apos;ll reach out to activate
          your invite once it&apos;s ready.
        </p>

        {/* Dev-only: statically stripped from production builds by the
            NODE_ENV check, since Next.js replaces process.env.NODE_ENV at
            build time. Lets you exercise the paid path locally before the
            real Whish webhook exists — never a real payment trigger. */}
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
