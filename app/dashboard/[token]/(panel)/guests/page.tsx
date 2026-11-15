import { BASE_URL, getDashboardGuests, getDashboardInvite, getEarlierRsvps, getSendingState } from "../../_lib/data";
import { summarizeGuests } from "../../_lib/format";
import GuestList, { type OpenSheet } from "../../_components/GuestList";
import GuestsTable from "../../_components/GuestsTable";

// The host's guest list: each guest gets a personal invitation link showing
// their name and seats, and replies come back here.
export default async function DashboardGuestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ add?: string; send?: string }>;
}) {
  const { token } = await params;
  const { add, send } = await searchParams;
  const invite = await getDashboardInvite(token);
  const [guests, earlier, sending] = await Promise.all([
    getDashboardGuests(invite.id),
    getEarlierRsvps(invite.id),
    getSendingState(invite.id),
  ]);
  const { seatsInvited, seatsConfirmed, total } = summarizeGuests(guests);
  // The Overview's "next step" links straight into a panel.
  const initialSheet: OpenSheet = add ? "add" : send === "reminder" ? "reminder" : send ? "invite" : null;

  return (
    <>
      <GuestList
        token={token}
        guests={guests}
        linkBase={`${BASE_URL}/i/${invite.slug}/g/`}
        fileName={`${invite.slug}-guests.csv`}
        sending={sending}
        event={{ hostNames: invite.host_names, category: invite.template?.category ?? null, eventDate: invite.event_date }}
        initialSheet={initialSheet}
        subtitle={
          total === 0 ? (
            "Add the people you're inviting. Each one gets their own invitation link."
          ) : (
            <>
              <span>
                {total} guest{total === 1 ? "" : "s"}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-[var(--ink)]">{seatsConfirmed}</strong> of {seatsInvited} seats confirmed
              </span>
            </>
          )
        }
      />

      {earlier.length > 0 && (
        <details className="group mt-6 rounded-[20px] border border-[var(--line)] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="display block text-[16px] font-bold">Earlier replies ({earlier.length})</span>
              <span className="mt-0.5 block text-[13px] text-[var(--ink)]/65">From guests you&apos;ve removed, or sent through your general link before guest lists.</span>
            </span>
            <span className="text-[13px] font-semibold text-[var(--blue-dark)] group-open:hidden">Show</span>
            <span className="hidden text-[13px] font-semibold text-[var(--blue-dark)] group-open:inline">Hide</span>
          </summary>
          <div className="border-t border-[var(--line)] px-5 py-5 sm:px-6">
            <GuestsTable rsvps={earlier} fileName={`${invite.slug}-earlier-replies.csv`} />
          </div>
        </details>
      )}
    </>
  );
}
