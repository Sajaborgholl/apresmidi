import { MAX_LENGTH, checkMapLink, isValidEventDate } from "@/lib/validation";

export type InviteFields = {
  hostNames: string;
  eventDate: string | null;
  venueName: string | null;
  venueMapUrl: string | null;
  dressCode: string | null;
  guestMessage: string | null;
  // Three "What to expect" captions, in order ("" for an empty one), or null
  // when all are empty.
  highlights: string[] | null;
};

// Reads the invite-content fields of the customize form and checks their
// size and format (lib/validation.ts). Shared by createOrder and
// updateInvite so a new order and an edit can never be held to different
// rules. "Is this field required?" stays with the caller: it depends on the
// template (and an order always needs host names).
//
// Errors are written for the customer — the actions show them as-is.
export function readInviteFields(formData: FormData): { fields: InviteFields } | { error: string } {
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const hostNames = text("host_names");
  if (hostNames.length > MAX_LENGTH.hostNames) {
    return { error: `Host names can be at most ${MAX_LENGTH.hostNames} characters.` };
  }

  const venueName = text("venue_name");
  if (venueName.length > MAX_LENGTH.venueName) {
    return { error: `The venue name can be at most ${MAX_LENGTH.venueName} characters.` };
  }

  const eventDate = text("event_date");
  if (eventDate && !isValidEventDate(eventDate)) {
    return { error: "Please enter a valid event date and time." };
  }

  let venueMapUrl: string | null = null;
  const rawMapUrl = text("venue_map_url");
  if (rawMapUrl) {
    const map = checkMapLink(rawMapUrl);
    if ("error" in map) return { error: map.error };
    venueMapUrl = map.url;
  }

  const dressCode = text("dress_code");
  if (dressCode.length > MAX_LENGTH.dressCode) {
    return { error: `The dress code can be at most ${MAX_LENGTH.dressCode} characters.` };
  }
  const guestMessage = text("guest_message");
  if (guestMessage.length > MAX_LENGTH.guestMessage) {
    return { error: `The note for your guests can be at most ${MAX_LENGTH.guestMessage} characters.` };
  }
  const highlightTexts = [1, 2, 3].map((n) => text(`highlight_${n}`));
  if (highlightTexts.some((h) => h.length > MAX_LENGTH.highlight)) {
    return { error: `Each "What to expect" line can be at most ${MAX_LENGTH.highlight} characters.` };
  }

  return {
    fields: {
      hostNames,
      eventDate: eventDate || null,
      venueName: venueName || null,
      venueMapUrl,
      dressCode: dressCode || null,
      guestMessage: guestMessage || null,
      highlights: highlightTexts.some(Boolean) ? highlightTexts : null,
    },
  };
}
