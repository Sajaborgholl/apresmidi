import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInviteGuest } from "@/lib/guests";
import { repliesClosed } from "@/lib/calendar";
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

  const hostPreview = host === "1";
  // After the reply deadline or the event's day, replies close
  // (submitGuestRsvp enforces it too).
  const closed = !invite.is_demo && repliesClosed(invite.event_date, invite.reply_by);

  return (
    <>
      {/* Counts the open from the guest's browser once the page is showing —
          not on the server, where WhatsApp's link-preview fetcher would count. */}
      {!hostPreview && <GuestOpenBeacon token={guest.token} />}
      {/* The host previewing: the form works as a demo (demo: true keeps
          replies in the browser), so they can't answer for the guest by
          accident. */}
      <InvitePageBody invite={invite} template={template} embedded={false} guest={{ ...guest, closed, replyBy: invite.reply_by ?? null, demo: hostPreview || undefined }} />
      {hostPreview && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: "calc(16px + env(safe-area-inset-bottom))",
            transform: "translateX(-50%)",
            zIndex: 2147483000,
            maxWidth: "calc(100vw - 32px)",
            padding: "10px 16px",
            borderRadius: 999,
            background: "#2C251D",
            color: "#FBF8F1",
            font: "600 13px/1.35 Inter, system-ui, sans-serif",
            textAlign: "center",
            boxShadow: "0 12px 40px rgba(28,24,19,0.3)",
          }}
        >
          Preview of {guest.name}&apos;s invitation. Replies here aren&apos;t saved.
        </div>
      )}
    </>
  );
}
