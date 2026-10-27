// TEMPORARY test route — delete before merging.
import WeddingRiadDoor from "@/app/i/[slug]/_designs/WeddingRiadDoor";
export default async function Page({ searchParams }: { searchParams: Promise<{ embed?: string }> }) {
  const embedded = (await searchParams).embed === "1";
  return <WeddingRiadDoor embedded={embedded} invite={{ id: "00000000-0000-0000-0000-000000000000", host_names: "Sultan & Jana", groom_parents: "Amer & Nadine Abdeen", bride_parents: "Faisal & Rima Alsarraj", event_date: "2027-05-22T18:00", venue_name: null, venue_map_url: null, primary_color: null, photo_urls: [], music_url: null, whatsapp_number: null, slug: "sultan-jana", is_demo: true }} />;
}
