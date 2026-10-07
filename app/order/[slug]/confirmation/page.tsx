import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle, WarningCircle, Sparkle, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import AutoRefresh from "../../../_components/AutoRefresh";
import ReloadOnBfcacheRestore from "../../../_components/ReloadOnBfcacheRestore";
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

// How long after payment the confirmation page keeps showing the dashboard
// link to the order_token holder. Long enough to come back to the tab, short
// enough that an old URL in browser history or a screenshot stops working.
// After this, the emailed link is the way in.
const DASHBOARD_LINK_WINDOW_MS = 24 * 60 * 60 * 1000;

function paidRecently(paidAt: string | null): boolean {
  return Boolean(paidAt) && Date.now() - new Date(paidAt as string).getTime() < DASHBOARD_LINK_WINDOW_MS;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Two ways in:
//   ?order=<order_token>  the customer's own private reference (createOrder's
//                         redirect and Whish's return). The only way to see
//                         the dashboard link here.
//   ?invite=<slug>        legacy links and invites made before order_token
//                         existed. The slug is the PUBLIC guest link, so this
//                         form must never reveal anything a guest shouldn't
//                         see — no dashboard link, ever.
export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string; invite?: string; result?: string }>;
}) {
  const { slug: templateSlug } = await params;
  const { order, invite: inviteParam, result } = await searchParams;
  const orderToken = order && UUID.test(order) ? order : null;

  // No order reference in the URL. This used to be a bare 404, which is what
  // customers saw when Whish's redirect dropped the query string (Whish now
  // returns to the path form instead — see ./[invite]/[[...result]]/page.tsx).
  // Anyone who still lands here, from an old link or a stripped URL, gets told
  // what happens next rather than a dead end: the payment callback runs server
  // to server and keeps its own reference, so a real payment is still
  // confirmed and emailed.
  if (!orderToken && !inviteParam) {
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
            <Sparkle size={26} weight="fill" style={{ color: "var(--ink)" }} />
          </div>
          <h1 className="display text-2xl font-bold md:text-[26px]">We couldn&apos;t open your order here</h1>
          <p className="mt-3 text-[14.5px] opacity-65">
            If you&apos;ve just paid, your payment is still being confirmed. We&apos;ll email your invite link and
            dashboard link to the address you gave us as soon as it goes through.
          </p>
          <a
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold transition active:scale-[0.97]"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            Message us on WhatsApp
          </a>
          <Link href="/" className="mt-3 inline-block text-sm font-medium underline underline-offset-4 opacity-70">
            Back to the homepage
          </Link>
        </div>
      </main>
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const lookup = supabaseAdmin.from("invites").select("host_names, status, slug, dashboard_token, paid_at");
  const { data: invite } = await (orderToken
    ? lookup.eq("order_token", orderToken)
    : lookup.eq("slug", inviteParam as string)
  ).single();

  if (!invite) notFound();

  const inviteSlug: string = invite.slug;
  // Keeps whichever reference this page was opened with, for TryAgainFallback.
  const selfHref = `/order/${templateSlug}/confirmation?${
    orderToken ? `order=${orderToken}` : `invite=${encodeURIComponent(inviteSlug)}`
  }`;

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
          <ReloadOnBfcacheRestore />
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

            <TryAgainFallback href={selfHref} />
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
        <ReloadOnBfcacheRestore />
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
  // Only the order_token holder, and only for a while after paying. Anyone
  // arriving by slug (which every guest has) gets the guest link and nothing
  // more.
  const showDashboardLink = Boolean(orderToken) && Boolean(invite.dashboard_token) && paidRecently(invite.paid_at);
  const dashboardUrl = showDashboardLink ? `${BASE_URL}/dashboard/${invite.dashboard_token}` : null;

  return (
    <main
      className="flex min-h-dvh items-center justify-center px-6 py-16"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
    >
      <ReloadOnBfcacheRestore />
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
          {dashboardUrl
            ? "Your invite is live. Save both links below, we also emailed them to you."
            : "Your invite is live. We emailed your private dashboard link to the address you gave us."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <CopyLinkButton label="Guest link" url={guestUrl} />
          {dashboardUrl && <CopyLinkButton label="Dashboard link" url={dashboardUrl} isPrivate />}
        </div>
      </div>
    </main>
  );
}
