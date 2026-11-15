import type { ReactNode } from "react";
import QRCode from "qrcode";
import { ArrowSquareOut, DownloadSimple, Info, PencilSimple, UsersThree, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import CopyLinkButton from "@/app/_components/CopyLinkButton";
import { BASE_URL, getDashboardInvite } from "../../_lib/data";
import { daysUntil, formatEventDate } from "../../_lib/format";
import { Button, Card, CountdownPill, PageHeader } from "../../_components/ui";
import PhonePreview from "../../_components/PhonePreview";
import ReplyDeadlineCard from "../../_components/ReplyDeadlineCard";
import { formatReplyBy, parseWallClock, replyDeadlinePassed } from "@/lib/calendar";
import { getTemplateBySlug } from "@/lib/templates/registry";
import SavedBanner from "../../_components/SavedBanner";

// Everything about the invitation itself: how it looks, what's on it, and
// its general link and QR code. Editing opens the full-screen editor.
export default async function DashboardInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { token } = await params;
  const { saved } = await searchParams;
  const invite = await getDashboardInvite(token);
  const guestUrl = `${BASE_URL}/i/${invite.slug}`;
  const shareText = `You're invited to ${invite.host_names}! See the invitation: ${guestUrl}`;
  const when = invite.event_date ? formatEventDate(invite.event_date) : null;
  const photos = (invite.photo_urls ?? []).filter(Boolean);
  const eventPassed = (daysUntil(invite.event_date) ?? 0) < 0;
  const notSet = <span className="font-normal text-[var(--ink)]/65">Not set</span>;
  // Which optional words this design shows (only those get a row).
  const templateFields = invite.template ? getTemplateBySlug(invite.template.slug)?.fields : undefined;
  const highlights = (invite.highlights ?? []).filter(Boolean);
  // The latest a reply deadline can be: the event's day.
  const event = parseWallClock(invite.event_date);
  const eventDay = event ? `${event.year}-${String(event.month).padStart(2, "0")}-${String(event.day).padStart(2, "0")}` : null;

  // The qrcode package needs literal hex, so this is --ink written out.
  const qrOptions = { margin: 1, color: { dark: "#2C251D", light: "#FFFFFF" } };
  const [qrSvg, qrPng] = await Promise.all([
    QRCode.toString(guestUrl, { ...qrOptions, type: "svg" }),
    QRCode.toDataURL(guestUrl, { ...qrOptions, width: 1024 }),
  ]);

  return (
    <>
      {saved === "1" && <SavedBanner />}

      <PageHeader
        title="Your invitation"
        subtitle={
          <>
            <span>{invite.template?.name ?? "Invitation"}</span>
            <CountdownPill eventDate={invite.event_date} />
          </>
        }
        actions={
          <>
            <Button href={`/i/${invite.slug}`} external icon={<ArrowSquareOut size={15} />}>
              View invitation
            </Button>
            <Button href={`/dashboard/${token}/edit?from=invitation`} variant="primary" icon={<PencilSimple size={15} />}>
              Edit invitation
            </Button>
          </>
        }
      />

      {eventPassed && (
        <p className="mb-5 rounded-2xl bg-black/[0.04] px-4 py-3 text-[13px] text-[var(--ink)]/65">Your event has passed. The invitation still works for guests.</p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        {/* ---------- Preview (last on phones) ---------- */}
        <div className="order-last flex flex-col items-center gap-3 lg:sticky lg:top-10 lg:order-first">
          <PhonePreview src={`/i/${invite.slug}?embed=1`} />
          <p className="text-[13px] text-[var(--ink)]/65">What your guests see</p>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* ---------- Details ---------- */}
          <Card title="Details" description="What's written on your invitation. Use Edit invitation to change it.">
            <dl className="divide-y divide-[var(--line)]">
              <Row label="Date">{when?.date ?? notSet}</Row>
              <Row label="Time">{when?.time ?? notSet}</Row>
              <Row label="Venue">
                {invite.venue_name ?? notSet}
                {invite.venue_map_url && (
                  <a
                    href={invite.venue_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex w-fit items-center gap-1 text-[13px] font-semibold text-[var(--blue-dark)] hover:opacity-70"
                  >
                    Open in Maps <ArrowSquareOut size={12} />
                  </a>
                )}
              </Row>
              <Row label="Design" hint="Editing changes the words and photos, not the design">
                {invite.template?.name ?? notSet}
              </Row>
              {templateFields?.dress_code && <Row label="Dress code">{invite.dress_code ?? notSet}</Row>}
              {templateFields?.guest_message && <Row label="Note for guests">{invite.guest_message ?? notSet}</Row>}
              {(templateFields?.highlights ?? 0) > 0 && (
                <Row label="What to expect">{highlights.length > 0 ? highlights.join(" · ") : notSet}</Row>
              )}
              <Row label="Photos">
                {photos.length === 0 ? (
                  notSet
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {photos.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt={`Invitation photo ${i + 1}`} className="h-14 w-14 rounded-xl object-cover" />
                    ))}
                  </div>
                )}
              </Row>
            </dl>
          </Card>

          {/* ---------- Reply deadline ---------- */}
          <ReplyDeadlineCard
            token={token}
            replyBy={invite.reply_by}
            maxDate={eventDay}
            closedText={invite.reply_by && replyDeadlinePassed(invite.reply_by) ? `Replies closed on ${formatReplyBy(invite.reply_by)}.` : null}
          />

          {/* ---------- Sharing ---------- */}
          {/* The general link can't take replies, so it's offered as the
              view-only option, and the way to collect RSVPs (personal
              invitations from Guests) comes first. */}
          <Card title="View-only link" description="For group chats, social posts and printed cards.">
            <div className="mb-4 flex gap-2.5 rounded-2xl bg-[var(--waiting-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]/80">
              <Info size={17} className="mt-0.5 shrink-0 text-[var(--waiting)]" />
              <div>
                <p>
                  <strong className="font-semibold text-[var(--ink)]">Guests can&apos;t reply from this link.</strong> To collect
                  replies, send each guest their personal invitation from your guest list.
                </p>
                <Button href={`/dashboard/${token}/guests`} size="sm" icon={<UsersThree size={14} />} className="mt-2.5">
                  Send personal invitations
                </Button>
              </div>
            </div>
            <CopyLinkButton label="View-only link" url={guestUrl} />
            <Button
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              external
              icon={<WhatsappLogo size={17} weight="fill" className="text-[var(--whatsapp)]" />}
              className="mt-3 w-full"
            >
              Share view-only link on WhatsApp
            </Button>

            <div className="mt-6 flex flex-col items-center gap-5 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center">
              <div
                className="w-36 shrink-0 rounded-2xl border border-[var(--line)] bg-white p-2.5 [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="text-center sm:text-left">
                <p className="text-[14px] font-semibold">QR code for printed cards</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink)]/65">
                  Put it on save-the-dates, table cards or a sign at the entrance. Guests who scan it see your invitation;
                  their replies still come through their personal link.
                </p>
                <Button href={qrPng} download={`${invite.slug}-qr.png`} size="sm" icon={<DownloadSimple size={14} />} className="mt-3">
                  Download PNG
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// Label on the left, value on the right.
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-3.5 sm:grid-cols-[150px_minmax(0,1fr)]">
      <dt className="text-[13px] text-[var(--ink)]/65">
        {label}
        {hint && <span className="mt-0.5 block text-[12px] leading-snug text-[var(--ink)]/65">{hint}</span>}
      </dt>
      <dd className="break-words text-[14px] font-semibold">{children}</dd>
    </div>
  );
}
