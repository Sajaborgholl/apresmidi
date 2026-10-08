import { buildWhatsappNumber } from "@/lib/types";
import { dialCodeForCountry } from "@/lib/countryCodes";
import { MAX_LENGTH, WHATSAPP_DIGITS, checkMapLink, isValidEventDate } from "@/lib/validation";

export type InviteFields = {
  hostNames: string;
  eventDate: string | null;
  venueName: string | null;
  venueMapUrl: string | null;
  whatsappNumber: string | null;
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

  // A country code on its own (no number typed) is no number at all — it
  // used to be saved as just the code, giving guests a dead WhatsApp button.
  const localDigits = text("whatsapp_number").replace(/\D/g, "");
  const whatsappNumber = localDigits
    ? buildWhatsappNumber(dialCodeForCountry(text("whatsapp_country")), localDigits)
    : null;
  if (whatsappNumber && (whatsappNumber.length < WHATSAPP_DIGITS.min || whatsappNumber.length > WHATSAPP_DIGITS.max)) {
    return { error: "Please enter a valid WhatsApp number, including the country code." };
  }

  return {
    fields: {
      hostNames,
      eventDate: eventDate || null,
      venueName: venueName || null,
      venueMapUrl,
      whatsappNumber,
    },
  };
}
