import QRCode from "qrcode";
import { ArrowSquareOut, DownloadSimple, WhatsappLogo, QrCode } from "@phosphor-icons/react/dist/ssr";
import CopyLinkButton from "@/app/_components/CopyLinkButton";
import { BASE_URL, getDashboardInvite } from "../../_lib/data";
import { daysUntil } from "../../_lib/format";
import { Card, CardHeader, PageHeader } from "../../_components/ui";

// The preview shows the invite on a real phone-sized screen, scaled down —
// same idea as the customize page's preview, so the template renders its
// true mobile layout rather than squeezing a desktop one into a small box.
const PHONE = { width: 390, height: 844 };
const PHONE_SCALE = 0.7;

export default async function DashboardSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const guestUrl = `${BASE_URL}/i/${invite.slug}`;
  const shareText = `You're invited to ${invite.host_names}! RSVP here: ${guestUrl}`;

  // The qrcode package needs literal hex, so this is --ink written out.
  const qrOptions = { margin: 1, color: { dark: "#2C251D", light: "#FFFFFF" } };
  const eventPassed = (daysUntil(invite.event_date) ?? 0) < 0;
  const [qrSvg, qrPng] = await Promise.all([
    QRCode.toString(guestUrl, { ...qrOptions, type: "svg" }),
    QRCode.toDataURL(guestUrl, { ...qrOptions, width: 1024 }),
  ]);

  return (
    <>
      <PageHeader title="Share" subtitle="Your guest link and QR code." />

      {eventPassed && (
        <p className="mb-5 rounded-xl bg-black/[0.04] px-4 py-3 text-[13px] text-[var(--ink)]/65">
          Your event has passed. The link still works for guests.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Guest link" />
            <CopyLinkButton label="Anyone with this link can view and RSVP" url={guestUrl} shareText={shareText} />
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full py-3 text-[13.5px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#25D366" }}
              >
                <WhatsappLogo size={17} weight="fill" />
                Share on WhatsApp
              </a>
              <a
                href={guestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-black/15 py-3 text-[13.5px] font-semibold transition hover:border-black/30 active:scale-[0.98]"
              >
                <ArrowSquareOut size={16} />
                Open invite
              </a>
            </div>
          </Card>

          <Card>
            <CardHeader title="QR code" />
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div
                className="w-44 shrink-0 rounded-2xl border border-black/[0.06] bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="text-center sm:text-left">
                <p className="flex items-center justify-center gap-1.5 text-[14px] font-semibold sm:justify-start">
                  <QrCode size={16} />
                  Perfect for printed cards
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink)]/55">
                  Add it to save-the-dates, table cards or a sign at the entrance. Guests scan it and land straight on your
                  invitation.
                </p>
                <a
                  href={qrPng}
                  download={`${invite.slug}-qr.png`}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition hover:opacity-90 active:scale-[0.97]"
                  style={{ background: "var(--ink)", color: "var(--cream)" }}
                >
                  <DownloadSimple size={15} />
                  Download PNG
                </a>
              </div>
            </div>
          </Card>
        </div>

        <Card className="flex flex-col items-center xl:w-[340px]">
          <h2 className="display mb-4 w-full text-[17px] font-bold">What guests see</h2>
          <div
            className="overflow-hidden rounded-[28px] border-[6px] border-[var(--ink)] bg-white"
            style={{ width: PHONE.width * PHONE_SCALE + 12, height: PHONE.height * PHONE_SCALE + 12 }}
          >
            <iframe
              src={`/i/${invite.slug}`}
              title="Live preview of your invitation"
              loading="lazy"
              style={{
                width: PHONE.width,
                height: PHONE.height,
                transform: `scale(${PHONE_SCALE})`,
                transformOrigin: "0 0",
                border: "none",
              }}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
