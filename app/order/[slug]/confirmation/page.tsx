import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
    .select("host_names, status")
    .eq("slug", inviteSlug)
    .single();

  if (!invite) notFound();

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Almost there, {invite.host_names}!
      </h1>
      <p className="mt-3 text-neutral-600">
        Your invite details are saved. It&apos;ll go live at your link as
        soon as payment is completed below.
      </p>

      {/* Stubbed until Whish/Tap API keys are wired in. Swap this for
          the real payment button once that's ready. */}
      <button
        disabled
        className="mt-8 w-full cursor-not-allowed rounded-full bg-neutral-300 px-5 py-3 font-medium text-neutral-600"
      >
        Pay with Whish — coming soon
      </button>
      <p className="mt-2 text-xs text-neutral-400">
        We&apos;re finishing payment setup. We&apos;ll reach out to activate
        your invite once it&apos;s ready.
      </p>
    </main>
  );
}
