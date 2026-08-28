import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { CheckCircle, WarningCircle, Sparkle, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import AutoRefresh from "../../../_components/AutoRefresh";
import CopyLinkButton from "../../../_components/CopyLinkButton";
import TryAgainFallback from "./_components/TryAgainFallback";
import { confirmInvitePayment, startWhishPayment } from "../actions";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Business WhatsApp number for the "Pay via WhatsApp" alternative to
// Whish — customers who'd rather arrange payment over chat than pay by
// card. Assumed Lebanon (+961), matching the rest of this app's Beirut-
// based demo data; wa.me numbers take no "+" or leading 0. If that
// assumption is wrong, this is the only line that needs to change.
const BUSINESS_WHATSAPP_NUMBER = "96170664401";

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
    // Just got redirected back from Whish's hosted page (see
    // successRedirectUrl in ../actions.ts) — the webhook that actually
    // flips this invite to "live" runs as an independent server-to-server
    // call, so it routinely hasn't landed yet by the time this render
    // happens. Showing the normal "pick a payment method" buttons here
    // would look like the payment never went through; this state makes
    // clear it's just a matter of AutoRefresh (below) catching up.
    if (result === "processing") {
      return (
        <main
          className="flex min-h-dvh items-center justify-center px-6 py-16"
          style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
        >
          <AutoRefresh />
          <div
            className="w-full max-w-md rounded-[28px] bg-white p-8 text-center md:p-10"
            style={{ boxShadow: "0 30px 70px rgba(31,36,48,0.10)" }}
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--blue)" }}
            >
              <CircleNotch size={26} weight="bold" className="animate-spin" style={{ color: "var(--ink)" }} />
            </div>
            <h1 className="display text-2xl font-bold md:text-[26px]">Confirming your payment&hellip;</h1>
            <p className="mt-3 text-[14.5px] opacity-65">
              This only takes a few seconds. This page will update on its own — no need to refresh.
            </p>

            <TryAgainFallback href={`/order/${templateSlug}/confirmation?invite=${encodeURIComponent(inviteSlug)}`} />
          </div>
        </main>
      );
    }

    return (
      <main
        className="flex min-h-dvh items-center justify-center px-6 py-16"
        style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
      >
        <AutoRefresh />
        <div
          className="w-full max-w-md rounded-[28px] bg-white p-8 text-center md:p-10"
          style={{ boxShadow: "0 30px 70px rgba(31,36,48,0.10)" }}
        >
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--yellow)" }}
          >
            <Sparkle size={26} weight="fill" style={{ color: "var(--ink)" }} />
          </div>
          <h1 className="display text-2xl font-bold md:text-[26px]">Almost there, {invite.host_names}!</h1>
          <p className="mt-3 text-[14.5px] opacity-65">
            Your invite details are saved. It&apos;ll go live at your link as
            soon as payment is completed below.
          </p>

          {result === "failure" && (
            <div
              className="mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-left text-[13.5px] font-medium"
              style={{ background: "rgba(180,84,84,0.08)", color: "#B45454" }}
            >
              <WarningCircle size={17} weight="fill" className="mt-0.5 shrink-0" />
              Payment didn&apos;t go through. You can try again below.
            </div>
          )}

          <form
            action={async () => {
              "use server";
              const collectUrl = await startWhishPayment(templateSlug, inviteSlug);
              redirect(collectUrl);
            }}
            className="mt-7"
          >
            <button
              type="submit"
              className="w-full rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Pay with Whish — $80
            </button>
          </form>

          {/* Alternative to Whish for customers who'd rather arrange
              payment over chat than pay by card — opens WhatsApp with a
              pre-filled message identifying this invite, addressed to the
              business number above. Unlike Whish, nothing here confirms
              payment automatically: the invite stays a draft until it's
              marked paid directly in Supabase once payment is actually
              received (see confirmInvitePayment in ../actions.ts for what
              that flips). */}
          <a
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hi! I'd like to pay for my invite — ${invite.host_names}, $80. (ref: ${inviteSlug})`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
            style={{ background: "#25D366", color: "#fff" }}
          >
            Pay via WhatsApp
          </a>

          {/* Dev-only: statically stripped from production builds by the
              NODE_ENV check, since Next.js replaces process.env.NODE_ENV at
              build time. Whish rejects localhost callback/redirect URLs
              outright, so the real "Pay with Whish" button above can't be
              exercised end-to-end locally — this stays the way to walk the
              paid path in local dev. Never a real payment trigger. */}
          {process.env.NODE_ENV !== "production" && (
            <>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide opacity-40">
                Local development only
              </p>
              <form
                action={async () => {
                  "use server";
                  await confirmInvitePayment(inviteSlug);
                }}
                className="mt-2"
              >
                <button
                  type="submit"
                  className="w-full rounded-full py-2.5 text-[13px] font-medium transition active:scale-[0.97]"
                  style={{ background: "var(--yellow)", color: "var(--ink)" }}
                >
                  Simulate payment success
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    );
  }

  const guestUrl = `${BASE_URL}/i/${invite.slug}`;
  const dashboardUrl = `${BASE_URL}/dashboard/${invite.dashboard_token}`;

  return (
    <main
      className="flex min-h-dvh items-center justify-center px-6 py-16"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-8 text-center md:p-10"
        style={{ boxShadow: "0 30px 70px rgba(31,36,48,0.10)" }}
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--blue)" }}
        >
          <CheckCircle size={26} weight="fill" style={{ color: "var(--ink)" }} />
        </div>
        <h1 className="display text-2xl font-bold md:text-[26px]">You&apos;re all set, {invite.host_names}!</h1>
        <p className="mt-3 text-[14.5px] opacity-65">
          Your invite is live. Save both links below, we also emailed them to you.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <CopyLinkButton label="Guest link" url={guestUrl} />
          <CopyLinkButton label="Dashboard link" url={dashboardUrl} isPrivate />
        </div>
      </div>
    </main>
  );
}
