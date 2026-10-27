// TEMPORARY test route — delete before merging.
import WeddingRiadDoor from "@/app/i/[slug]/_designs/WeddingRiadDoor";
export default async function Page({ searchParams }: { searchParams: Promise<{ embed?: string }> }) {
  const embedded = (await searchParams).embed === "1";
  return <WeddingRiadDoor embedded={embedded} invite={{ id: "00000000-0000-0000-0000-000000000000", host_names: "Sultan & Jana", groom_parents: "Amer & Nadine Abdeen", bride_parents: "Faisal & Rima Alsarraj", host_names_ar: "سلطان عابدين & جنا السراج", groom_parents_ar: "عامر و نادين عابدين", bride_parents_ar: "فيصل و ريما السراج", event_date: "2027-05-22T18:00", venue_name: "Kasbah d’If, Agafay Desert, Marrakesh", venue_map_url: "https://maps.app.goo.gl/u9giNUGsanvdQbCx8", primary_color: null, photo_urls: [], music_url: null, whatsapp_number: null, slug: "sultan-jana", pre_wedding: { event_date: "2027-05-21T20:00", venue_name: null, venue_map_url: null }, is_demo: true }} />;
}
