import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateBySlug } from "@/lib/templates/registry";
import CustomizePanel from "@/app/order/[slug]/_components/CustomizePanel";
import { BASE_URL, getDashboardInvite } from "../_lib/data";
import { updateInvite, type EditReturnTo } from "../actions";

export const metadata: Metadata = {
  title: "Edit your invite — Après-midi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The customize page, reused full-screen (outside the dashboard's sidebar
// layout) to edit an invite that's already live.
export default async function DashboardEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { token } = await params;
  // Which tab opened the editor: Back and Save both return there.
  const returnTo: EditReturnTo = (await searchParams).from === "invitation" ? "invitation" : "overview";
  const backHref = `/dashboard/${token}${returnTo === "invitation" ? "/invitation" : ""}`;
  const invite = await getDashboardInvite(token);
  const entry = invite.template ? getTemplateBySlug(invite.template.slug) : undefined;
  if (!invite.template || !entry) notFound();

  return (
    <main>
      <CustomizePanel
        slug={invite.template.slug}
        category={invite.template.category}
        fields={entry.fields}
        edit={{
          action: updateInvite.bind(null, token, returnTo),
          initialValues: {
            host_names: invite.host_names,
            // datetime-local wants "YYYY-MM-DDTHH:mm". The stored value came
            // from exactly that string, read by Postgres as UTC, so the UTC
            // ISO form gives back what the host originally typed.
            event_date: invite.event_date ? new Date(invite.event_date).toISOString().slice(0, 16) : "",
            venue_name: invite.venue_name ?? "",
            venue_map_url: invite.venue_map_url ?? "",
            dress_code: invite.dress_code ?? "",
            guest_message: invite.guest_message ?? "",
            highlight_1: invite.highlights?.[0] ?? "",
            highlight_2: invite.highlights?.[1] ?? "",
            highlight_3: invite.highlights?.[2] ?? "",
          },
          initialPhotoUrls: invite.photo_urls ?? [],
          backHref,
          guestUrl: `${BASE_URL}/i/${invite.slug}`,
        }}
      />
    </main>
  );
}
