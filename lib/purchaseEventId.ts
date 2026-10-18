import "server-only";

import { createHash } from "node:crypto";

// One id per paid invite, shared by the browser Purchase (PurchasePixel) and
// the server one (lib/metaCapi.ts) so Meta counts the sale once. A hash, not
// the slug, so no customer names end up in a URL sent to Meta.
export function purchaseEventId(inviteSlug: string): string {
  return "purchase-" + createHash("sha256").update(inviteSlug).digest("hex").slice(0, 20);
}
