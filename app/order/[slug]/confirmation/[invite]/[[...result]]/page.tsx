import { redirect } from "next/navigation";

// Whish's return address after its hosted payment page:
//   /order/<template>/confirmation/<ref>            (no result)
//   /order/<template>/confirmation/<ref>/processing (successRedirectUrl)
//   /order/<template>/confirmation/<ref>/failure    (failureRedirectUrl)
//
// <ref> is the invite's private order_token (a UUID), or — for invites made
// before order_token existed — its slug. See startWhishPayment.
//
// The ref and result live in the PATH here, not the query string, because
// Whish's browser redirect drops query strings: customers came back to a bare
// /order/<template>/confirmation, and that page can't know which order it's
// for. A path survives the redirect. This route only translates it into the
// query form the real confirmation page (../../page.tsx) reads, so all of the
// confirmation logic stays in one place.
const RESULTS = new Set(["processing", "failure"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function WhishReturnPage({
  params,
}: {
  params: Promise<{ slug: string; invite: string; result?: string[] }>;
}) {
  const { slug, invite, result } = await params;
  const ref = decodeURIComponent(invite);
  // Slugs never look like a UUID (they always start with the host names).
  const query = new URLSearchParams(UUID.test(ref) ? { order: ref } : { invite: ref });
  const outcome = result?.[0];
  if (outcome && RESULTS.has(outcome)) query.set("result", outcome);
  redirect(`/order/${encodeURIComponent(slug)}/confirmation?${query.toString()}`);
}
