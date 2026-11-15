import { redirect } from "next/navigation";

// Sharing moved into the Invitation tab; old links land there.
export default async function DashboardSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/dashboard/${token}/invitation`);
}
