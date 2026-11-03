import { SAMPLE_GUEST } from "@/lib/guestRules";
import { InvitePageBody, loadPublicInvite } from "./_lib/invitePage";

export const dynamic = "force-dynamic";

// The general invitation link. It shows the invitation, but RSVPs come only
// through each guest's personal link (/i/<slug>/g/<token>), which the host
// sends from their dashboard — so here the templates show "RSVP through the
// personal invitation you received" instead of a form. Demo invitations
// (homepage, template pages) show a sample guest so visitors see the
// personal RSVP; their replies aren't saved.
export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  // ?embed=1: this page is a preview inside another page (HeroPreview, the
  // dashboard's phone) — see TemplateEntry.component in the registry.
  const embedded = (await searchParams).embed === "1";
  const { invite, template } = await loadPublicInvite(slug);

  return (
    <InvitePageBody
      invite={invite}
      template={template}
      embedded={embedded}
      guest={invite.is_demo ? SAMPLE_GUEST : null}
    />
  );
}
