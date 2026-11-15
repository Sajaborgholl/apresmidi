import { redirect } from "next/navigation";

// Event details moved into the Invitation tab; old links land there.
export default async function DashboardEventPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/dashboard/${token}/invitation`);
}
