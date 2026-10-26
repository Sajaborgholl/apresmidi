// TEMPORARY test route — delete before merging.
import WeddingWatercolorRiad from "@/app/i/[slug]/_designs/WeddingWatercolorRiad";
export default async function Page({ searchParams }: { searchParams: Promise<{ embed?: string }> }) {
  const embedded = (await searchParams).embed === "1";
  return <WeddingWatercolorRiad embedded={embedded} invite={{ id: "00000000-0000-0000-0000-000000000000", host_names: "Lea & Karim", event_date: "2027-06-12T18:30", venue_name: "Domaine des Tourelles, Chtaura", venue_map_url: "https://maps.google.com/", primary_color: null, photo_urls: [], music_url: null, whatsapp_number: "96170000000", slug: "lea-karim", is_demo: true }} />;
}
