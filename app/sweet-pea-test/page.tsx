// TEMPORARY test route — delete before merging.
import WeddingSweetPea from "@/app/i/[slug]/_designs/WeddingSweetPea";
import { SAMPLE_GUEST } from "@/lib/guestRules";
export default async function Page({ searchParams }: { searchParams: Promise<{ embed?: string; general?: string }> }) {
  const sp = await searchParams;
  return (
    <WeddingSweetPea
      embedded={sp.embed === "1"}
      guest={sp.general === "1" ? null : SAMPLE_GUEST}
      invite={{ id: "00000000-0000-0000-0000-000000000000", host_names: "Ghina & Malek", event_date: "2027-08-08T20:00", venue_name: "123 Anywhere Street", venue_map_url: "https://www.google.com/maps/search/?api=1&query=123+Anywhere+Street", primary_color: null, photo_urls: [], music_url: null, whatsapp_number: null, slug: "ghina-malek", is_demo: true }}
    />
  );
}
