import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowSquareOut, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { getDashboardInvite } from "../../_lib/data";
import { formatEventDate } from "../../_lib/format";
import { Card, CardHeader, PageHeader, CountdownPill } from "../../_components/ui";

export default async function DashboardEventPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const when = invite.event_date ? formatEventDate(invite.event_date) : null;
  const photos = (invite.photo_urls ?? []).filter(Boolean);
  const notSet = <span className="font-normal text-[var(--ink)]/35">Not set</span>;

  return (
    <>
      <PageHeader title="Event details" subtitle={<CountdownPill eventDate={invite.event_date} />} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="display text-[17px] font-bold">What&apos;s on your invite</h2>
            <Link
              href={`/dashboard/${token}/edit`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--blue-dark)] transition hover:opacity-70"
            >
              <PencilSimple size={14} />
              Edit
            </Link>
          </div>
          <dl className="divide-y divide-black/[0.06]">
            <Row label="Date">{when?.date ?? notSet}</Row>
            <Row label="Time">{when?.time ?? notSet}</Row>
            <Row label="Venue">
              {invite.venue_name ?? notSet}
              {invite.venue_map_url && (
                <a
                  href={invite.venue_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-[12.5px] font-semibold text-[var(--blue-dark)] hover:opacity-70"
                >
                  Open in Maps <ArrowSquareOut size={12} />
                </a>
              )}
            </Row>
            <Row label="RSVP WhatsApp">{invite.whatsapp_number ? `+${invite.whatsapp_number}` : notSet}</Row>
            <Row label="Design">{invite.template?.name ?? notSet}</Row>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Photos" />
          {photos.length === 0 ? (
            <p className="text-[13px] text-[var(--ink)]/45">No photos on this invite.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`Invite photo ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

// Label on the left, value on the right: a plain definition list, no icons.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3.5 sm:grid-cols-[160px_minmax(0,1fr)]">
      <dt className="text-[13px] text-[var(--ink)]/50">{label}</dt>
      <dd className="break-words text-[14px] font-semibold">{children}</dd>
    </div>
  );
}
