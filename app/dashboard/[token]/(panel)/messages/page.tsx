import { ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { getDashboardInvite, getDashboardRsvps } from "../../_lib/data";
import { relativeTime } from "../../_lib/format";
import { Avatar, EmptyState, PageHeader, StatusPill } from "../../_components/ui";

export default async function DashboardMessagesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const messages = (await getDashboardRsvps(invite.id)).filter((r) => r.message);

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle={messages.length > 0 ? `${messages.length} note${messages.length === 1 ? "" : "s"} from your guests` : undefined}
      />

      {messages.length === 0 ? (
        <div className="rounded-2xl bg-white">
          <EmptyState icon={<ChatCircleText size={22} />} title="No messages yet">
            Notes guests add to their RSVP appear here.
          </EmptyState>
        </div>
      ) : (
        // CSS columns give the guestbook a masonry feel: notes vary a lot in
        // length and a fixed grid would leave big gaps under short ones.
        <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
          {messages.map((r) => (
            <figure
              key={r.id}
              className="mb-5 break-inside-avoid rounded-2xl border border-black/[0.07] bg-white p-6"
            >
              <blockquote className="text-[15px] leading-relaxed text-[var(--ink)]/85">{r.message}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-black/[0.05] pt-4">
                <Avatar name={r.guest_name} muted={!r.attending} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{r.guest_name}</p>
                  <p className="text-[11.5px] text-[var(--ink)]/45">{relativeTime(r.created_at)}</p>
                </div>
                <StatusPill attending={r.attending} />
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
