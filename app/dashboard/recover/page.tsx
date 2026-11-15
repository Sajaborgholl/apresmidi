import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { getSupabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { sendDashboardLinksEmail } from "@/lib/email";
import { EMAIL_PATTERN, MAX_LENGTH } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Get your dashboard link — Après-midi",
  robots: { index: false, follow: false },
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// There are no accounts: the dashboard link is the only way in. A host who
// lost it types the email they ordered with, and every live invitation on
// that address is emailed to it. The page says the same thing whether or not
// the address has an invitation, so it can't be used to check who ordered.
async function requestLinks(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email || email.length > MAX_LENGTH.email || !EMAIL_PATTERN.test(email)) {
    redirect("/dashboard/recover?error=email");
  }
  // Per connection and per address, so nobody can flood someone's inbox.
  const ip = await clientIp();
  if (!(await rateLimit("recover-ip", ip, 10, 60 * 60)) || !(await rateLimit("recover-email", email.toLowerCase(), 3, 60 * 60))) {
    redirect("/dashboard/recover?sent=1");
  }

  // Case-insensitive exact match: escape ilike's wildcards.
  const pattern = email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data } = await getSupabaseAdmin()
    .from("invites")
    .select("host_names, dashboard_token")
    .ilike("owner_email", pattern)
    .eq("status", "live")
    .not("dashboard_token", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (data && data.length > 0) {
    try {
      await sendDashboardLinksEmail({
        to: email,
        invites: data.map((i) => ({ hostNames: i.host_names, dashboardUrl: `${BASE_URL}/dashboard/${i.dashboard_token}` })),
      });
    } catch (err) {
      console.error("requestLinks: email failed", err);
    }
  }
  redirect("/dashboard/recover?sent=1");
}

export default async function RecoverDashboardPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;

  return (
    <main
      className="flex min-h-dvh items-center justify-center px-6 py-16"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
    >
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center md:p-10" style={{ boxShadow: "0 30px 70px rgba(31,36,48,0.10)" }}>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--blue)" }}>
          <EnvelopeSimple size={26} weight="fill" style={{ color: "var(--ink)" }} />
        </div>
        <h1 className="display text-2xl font-bold">Get your dashboard link</h1>

        {sent ? (
          <p className="mt-3 text-[14.5px] leading-relaxed opacity-70">
            If that email has an invitation with us, we&apos;ve just sent its dashboard link there. Check your inbox and spam
            folder in a few minutes.
          </p>
        ) : (
          <>
            <p className="mt-3 text-[14.5px] leading-relaxed opacity-70">
              Type the email you used when ordering. We&apos;ll send the link to your private dashboard there.
            </p>
            <form action={requestLinks} className="mt-6 flex flex-col gap-3 text-left">
              <label className="text-[13px] font-semibold opacity-70" htmlFor="recover-email">
                Your email
              </label>
              <input
                id="recover-email"
                name="email"
                type="email"
                required
                maxLength={MAX_LENGTH.email}
                placeholder="you@email.com"
                autoComplete="email"
                aria-invalid={error === "email"}
                className="w-full rounded-xl border border-black/[0.12] bg-white px-3.5 py-3 text-[14px] outline-none focus:border-[var(--blue-dark)]"
              />
              {error === "email" && <p className="text-[13px] font-medium text-[#B45454]">Please enter a valid email address.</p>}
              <button
                type="submit"
                className="mt-1 w-full rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
                style={{ background: "var(--ink)", color: "var(--cream)" }}
              >
                Email me my link
              </button>
            </form>
          </>
        )}

        <Link href="/" className="mt-6 inline-block text-[13px] font-semibold opacity-60 hover:opacity-100">
          Back to Après-midi
        </Link>
      </div>
    </main>
  );
}
