import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateBySlug } from "@/lib/templates/registry";
import { splitWhatsappNumber } from "@/lib/countryCodes";
import CustomizePanel from "@/app/order/[slug]/_components/CustomizePanel";
import { BASE_URL, getDashboardInvite } from "../_lib/data";
import { updateInvite } from "../actions";

export const metadata: Metadata = {
  title: "Edit your invite — Après-midi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The customize page, reused full-screen (outside the dashboard's sidebar
// layout) to edit an invite that's already live.
export default async function DashboardEditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const entry = invite.template ? getTemplateBySlug(invite.template.slug) : undefined;
  if (!invite.template || !entry) notFound();

  const whatsapp = splitWhatsappNumber(invite.whatsapp_number);

  return (
    <main>
      <CustomizePanel
        slug={invite.template.slug}
        category={invite.template.category}
        fields={entry.fields}
        edit={{
          action: updateInvite.bind(null, token),
          initialValues: {
            owner_email: "",
            host_names: invite.host_names,
            // datetime-local wants "YYYY-MM-DDTHH:mm". The stored value came
            // from exactly that string, read by Postgres as UTC, so the UTC
            // ISO form gives back what the host originally typed.
            event_date: invite.event_date ? new Date(invite.event_date).toISOString().slice(0, 16) : "",
            venue_name: invite.venue_name ?? "",
            venue_map_url: invite.venue_map_url ?? "",
            whatsapp_country: whatsapp.country,
            whatsapp_number: whatsapp.number,
          },
          initialPhotoUrls: invite.photo_urls ?? [],
          backHref: `/dashboard/${token}`,
          guestUrl: `${BASE_URL}/i/${invite.slug}`,
        }}
      />
    </main>
  );
}
