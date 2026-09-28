import { getDashboardInvite, getDashboardRsvps } from "../../_lib/data";
import { summarizeRsvps } from "../../_lib/format";
import { Card, PageHeader } from "../../_components/ui";
import GuestsTable from "../../_components/GuestsTable";

export default async function DashboardGuestsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const rsvps = await getDashboardRsvps(invite.id);
  const { headcount, accepted, total } = summarizeRsvps(rsvps);

  return (
    <>
      <PageHeader
        title="Guests"
        subtitle={
          <>
            <strong className="text-[var(--ink)]">{headcount}</strong> people attending from {accepted.length} of {total}{" "}
            RSVP{total === 1 ? "" : "s"}
          </>
        }
      />
      <Card>
        <GuestsTable rsvps={rsvps} fileName={`${invite.slug}-guests.csv`} />
      </Card>
    </>
  );
}
