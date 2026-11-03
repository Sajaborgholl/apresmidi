import { BASE_URL, getDashboardGuests, getDashboardInvite, getEarlierRsvps, getSendingState } from "../../_lib/data";
import { summarizeGuests } from "../../_lib/format";
import { Card, CardHeader, PageHeader } from "../../_components/ui";
import GuestList from "../../_components/GuestList";
import GuestsTable from "../../_components/GuestsTable";

// The host's guest list: each guest gets a personal invitation link showing
// their name and seats, and replies come back here.
export default async function DashboardGuestsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const [guests, earlier, sending] = await Promise.all([
    getDashboardGuests(invite.id),
    getEarlierRsvps(invite.id),
    getSendingState(invite.id),
  ]);
  const { seatsInvited, seatsConfirmed, accepted, waiting, total } = summarizeGuests(guests);

  return (
    <>
      <PageHeader
        title="Guests"
        subtitle={
          total === 0 ? (
            "Add the people you're inviting. Each one gets their own invitation link."
          ) : (
            <>
              <strong className="text-[var(--ink)]">{seatsConfirmed}</strong> of {seatsInvited} seats confirmed ·{" "}
              {accepted.length} coming · {waiting.length} waiting
            </>
          )
        }
      />
      <Card>
        <GuestList
          token={token}
          guests={guests}
          linkBase={`${BASE_URL}/i/${invite.slug}/g/`}
          fileName={`${invite.slug}-guests.csv`}
          sending={sending}
          event={{ hostNames: invite.host_names, category: invite.template?.category ?? null, eventDate: invite.event_date }}
        />
      </Card>

      {earlier.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Earlier replies" />
          <p className="-mt-3 mb-4 text-[13px] text-[var(--ink)]/55">
            Replies sent through your invitation&apos;s general link, before guest lists.
          </p>
          <GuestsTable rsvps={earlier} fileName={`${invite.slug}-earlier-replies.csv`} />
        </Card>
      )}
    </>
  );
}
