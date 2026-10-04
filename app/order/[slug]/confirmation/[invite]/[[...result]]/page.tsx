import { redirect } from "next/navigation";

// Whish's return address after its hosted payment page:
//   /order/<template>/confirmation/<invite>            (no result)
//   /order/<template>/confirmation/<invite>/processing (successRedirectUrl)
//   /order/<template>/confirmation/<invite>/failure    (failureRedirectUrl)
//
// The invite and result live in the PATH here, not the query string, because
// Whish's browser redirect drops query strings: customers came back to a bare
// /order/<template>/confirmation, and that page can't know which order it's
// for. A path survives the redirect. This route only translates it into the
// query form the real confirmation page (../../page.tsx) reads, so all of the
// confirmation logic stays in one place.
const RESULTS = new Set(["processing", "failure"]);

export default async function WhishReturnPage({
  params,
}: {
  params: Promise<{ slug: string; invite: string; result?: string[] }>;
}) {
  const { slug, invite, result } = await params;
  const query = new URLSearchParams({ invite: decodeURIComponent(invite) });
  const outcome = result?.[0];
  if (outcome && RESULTS.has(outcome)) query.set("result", outcome);
  redirect(`/order/${encodeURIComponent(slug)}/confirmation?${query.toString()}`);
}
