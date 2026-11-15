import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle, WarningCircle, Sparkle, CircleNotch, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import AutoRefresh from "../../../_components/AutoRefresh";
import ReloadOnBfcacheRestore from "../../../_components/ReloadOnBfcacheRestore";
import CopyLinkButton from "../../../_components/CopyLinkButton";
import TryAgainFallback from "./_components/TryAgainFallback";
import PurchasePixel from "./_components/PurchasePixel";
import { purchaseEventId } from "@/lib/purchaseEventId";
import { confirmInvitePayment } from "@/lib/payments";
import { startWhishPayment } from "../actions";
import { BUSINESS_WHATSAPP_NUMBER } from "@/lib/contact";
import { STANDARD_PLAN } from "@/lib/plans";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// How long after payment the confirmation page keeps showing the dashboard
// link to the order_token holder. Long enough to come back to the tab, short
// enough that an old URL in browser history or a screenshot stops working.
// After this, the emailed link is the way in.
const DASHBOARD_LINK_WINDOW_MS = 24 * 60 * 60 * 1000;

function paidRecently(paidAt: string | null): boolean {
  return Boolean(paidAt) && Date.now() - new Date(paidAt as string).getTime() < DASHBOARD_LINK_WINDOW_MS;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ?result= values that show a message on the unpaid view. "failure" comes
// back from Whish's hosted page; the other two from the Pay button below
// when startWhishPayment couldn't start a payment at all.
const PAYMENT_RESULT = { "rate-limited": "pay-limit", failed: "pay-error" } as const;
const PAYMENT_MESSAGES: Record<string, string> = {
  failure: "Payment didn't go through. You can try again below.",
  "pay-error": "We couldn't open the payment page just now. Please try again in a moment, or message us on WhatsApp below.",
  "pay-limit": "Too many payment attempts — please wait a few minutes and try again, or message us on WhatsApp below.",
};

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
  const lookup = supabaseAdmin.from("invites").select("host_names, status, slug, dashboard_token, paid_at, templates(name)");
  const { data: invite } = await (orderToken
    ? lookup.eq("order_token", orderToken)
    : lookup.eq("slug", inviteParam as string)
  ).single();

  if (!invite) notFound();

  const inviteSlug: string = invite.slug;
  // The design's name, for the WhatsApp message (same object-or-array join
  // shape as elsewhere: there's no generated Database type).
  const templateRel = invite.templates as { name: string } | { name: string }[] | null;
  const templateName = (Array.isArray(templateRel) ? templateRel[0]?.name : templateRel?.name) ?? "invitation";
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

          {result && PAYMENT_MESSAGES[result] && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-left text-[13.5px] font-medium"
              style={{ background: "rgba(180,84,84,0.08)", color: "#B45454" }}
            >
              <WarningCircle size={17} weight="fill" className="mt-0.5 shrink-0" />
              {PAYMENT_MESSAGES[result]}
            </div>
          )}

          <form
            action={async () => {
              "use server";
              const payment = await startWhishPayment(templateSlug, inviteSlug);
              if ("collectUrl" in payment) redirect(payment.collectUrl);
              // Back to this same page: it re-reads the invite, so
              // "already-paid" simply shows the paid view, and the other
              // two show their message above the buttons.
              redirect(payment.error === "already-paid" ? selfHref : `${selfHref}&result=${PAYMENT_RESULT[payment.error]}`);
            }}
            className="mt-7"
          >
            <button
              type="submit"
              className="w-full rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Pay with Whish — {STANDARD_PLAN.price}
            </button>
          </form>

          {/* Card payments aren't set up yet: shown so customers know it's
              coming, but it can't be pressed. */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-black/10 py-3.5 text-sm font-semibold"
            style={{ background: "rgba(0,0,0,0.04)", color: "rgba(44,37,29,0.5)" }}
          >
            Pay by credit card <span className="font-medium">(coming soon)</span>
          </button>

          {/* For customers who'd rather talk to us first: opens WhatsApp to
              the business number with a message naming this design and
              order (the ref is the invite's slug, to find it in Supabase). */}
          <p className="mt-6 text-[13px] opacity-60">Prefer to talk to us first?</p>
          <a
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hi! I'd like the ${templateName} invitation for ${invite.host_names}. (ref: ${inviteSlug})`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
            style={{ background: "#25D366", color: "#fff" }}
          >
            <WhatsappLogo size={18} weight="fill" />
            I want this invitation
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
                  // The button is stripped from production builds, but this
                  // action is still registered there — so it refuses too.
                  if (process.env.NODE_ENV === "production") return;
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
      {/* The buyer's own view (order token), shortly after paying: report the
          sale to the Meta Pixel. Not for visitors arriving by slug. */}
      {orderToken && paidRecently(invite.paid_at) && <PurchasePixel eventId={purchaseEventId(inviteSlug)} />}
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
            ? "Your invitation is live. Next, open your dashboard and add your guests: we send each one their own invitation on WhatsApp."
            : "Your invitation is live. We emailed your private dashboard link to the address you gave us."}
        </p>

        {/* The dashboard is the next step (adding guests is how RSVPs come
            in), so it's the main action; the general link is view-only. */}
        {dashboardUrl && (
          <>
            <a
              href={dashboardUrl}
              className="mt-7 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Open your dashboard
            </a>
            <p className="mt-2.5 text-[12.5px] opacity-60">
              Bookmark it. This link is your only way back in, and we&apos;ve emailed it to you too.
            </p>
          </>
        )}

        <div className="mt-7 flex flex-col gap-3">
          {dashboardUrl && <CopyLinkButton label="Dashboard link" url={dashboardUrl} isPrivate />}
          <CopyLinkButton label="View-only link (guests can't reply from it)" url={guestUrl} />
        </div>

        <p className="mt-6 text-[12.5px] opacity-60">
          Lost your dashboard link?{" "}
          <Link href="/dashboard/recover" className="font-semibold underline underline-offset-2">
            Email it to me again
          </Link>
        </p>
      </div>
    </main>
  );
}
