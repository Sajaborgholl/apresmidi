import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInviteGuest } from "@/lib/guests";
import { InvitePageBody, loadPublicInvite } from "../../_lib/invitePage";
import GuestOpenBeacon from "./GuestOpenBeacon";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; token: string }>;

// A guest's personal invitation: the same template as the general link, plus
// their name and reserved seats, and an RSVP tied to them.

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { invite } = await loadPublicInvite(slug);
  // What WhatsApp shows under the link. Deliberately not the guest's name:
  // link previews can be cached and shown to anyone the link is forwarded to.
  return {
    title: `${invite.host_names} invite you`,
    description: "Open your personal invitation and RSVP.",
    robots: { index: false, follow: false },
    openGraph: { title: `${invite.host_names} invite you`, description: "Open your personal invitation and RSVP." },
  };
}

export default async function GuestInvitePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ host?: string }>;
}) {
  const { slug, token } = await params;
  // The host viewing it from their dashboard ("?host=1"): not the guest opening it.
  const { host } = await searchParams;
  const { invite, template } = await loadPublicInvite(slug);
  const guest = await getInviteGuest(invite.id, token);
  if (!guest) notFound();

  return (
    <>
      {/* Counts the open from the guest's browser once the page is showing —
          not on the server, where WhatsApp's link-preview fetcher would count. */}
      {host !== "1" && <GuestOpenBeacon token={guest.token} />}
      <InvitePageBody invite={invite} template={template} embedded={false} guest={guest} />
    </>
  );
}
