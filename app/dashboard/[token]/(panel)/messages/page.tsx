import { ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { getDashboardInvite, getDashboardRsvps } from "../../_lib/data";
import { Card, EmptyState, PageHeader } from "../../_components/ui";
import MessagesBoard from "../../_components/MessagesBoard";

export default async function DashboardMessagesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getDashboardInvite(token);
  const messages = (await getDashboardRsvps(invite.id)).filter((r) => r.message);

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle={messages.length > 0 ? `${messages.length} note${messages.length === 1 ? "" : "s"} from your guests` : "Notes your guests add to their reply"}
      />

      {messages.length === 0 ? (
        <Card>
          <EmptyState icon={<ChatCircleText size={22} />} title="No messages yet">
            When guests reply to your invitation they can add a note. Each one shows up here.
          </EmptyState>
        </Card>
      ) : (
        <MessagesBoard messages={messages} />
      )}
    </>
  );
}
