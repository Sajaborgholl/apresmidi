import { parseWallClock } from "@/lib/calendar";

// The WhatsApp templates guests and hosts receive through Kapso (WhatsApp's
// official API), all in English. Messages a business starts must be templates
// Meta approved beforehand; the variable parts ({{guest_name}}…) are filled
// per message.
//
// This file is the one source for their wording: scripts/kapso-templates.ts
// submits exactly these definitions for approval, the queue fills the same
// variables when sending, and the dashboard's "See message" preview renders
// them — so what hosts preview is what guests get. Plain data and functions,
// no secrets: client components import it too.
//
// Changing wording here means submitting a new template version to Meta
// (approved templates can't be edited): give it a new name (bump
// TEMPLATE_VERSION for all of them, or a suffix for one, like
// "invitation_v2"), run the submit script, and wait for approval before
// deploying.

export const TEMPLATE_VERSION = 1;

export type TemplateKind = "invite" | "reminder" | "guest_reply";

export type TemplateDefinition = {
  kind: TemplateKind;
  // Meta template name and language code.
  name: string;
  language: "en";
  body: string;
  footer?: string;
  // A link button to the guest's invitation. Meta doesn't allow buttons that
  // link to WhatsApp itself (wa.me), so the forwarded reply has none.
  button?: { text: string };
  // One sample value per variable, required by Meta's review.
  examples: Record<string, string>;
};

const tname = (base: string) => `apresmidi_${base}${TEMPLATE_VERSION > 1 ? `_v${TEMPLATE_VERSION}` : ""}`;

const EXAMPLES = {
  guest_name: "Rami & family",
  host_names: "Jad & Mariana",
  event: "wedding",
  date_text: "on 17 August 2027",
  seats_text: "3 seats are reserved for you",
};
const REPLY_EXAMPLES = {
  guest_name: "Rami Haddad",
  guest_phone: "96170123456",
  event: "wedding",
  message: "We'll be there, can't wait!",
};

// Worded as a notification ("here is your invitation"): Meta classed the
// first version ("would love for you to join…") as Marketing.
const INVITE = `Dear {{guest_name}},

Here is your invitation from {{host_names}} to their {{event}} {{date_text}}. {{seats_text}}.

Tap below to view it and RSVP.`;

// Also factual: Meta classed the first version ("a gentle reminder… they'd
// love to know if you can make it") as Marketing.
const REMINDER = `Hi {{guest_name}}, you haven't replied yet to your invitation from {{host_names}} to their {{event}} {{date_text}}.

Tap below to RSVP.`;

const REPLY = `New message from {{guest_name}} (+{{guest_phone}}), a guest at your {{event}}, in reply to your invitation:

"{{message}}"

Tap their number to reply to them directly.`;

const FOOTER = "Sent with Après-midi";

export const TEMPLATES: TemplateDefinition[] = [
  { kind: "invite", name: tname("invitation_v2"), language: "en", body: INVITE, footer: FOOTER, button: { text: "Open your invitation" }, examples: EXAMPLES },
  { kind: "reminder", name: tname("reminder_v2"), language: "en", body: REMINDER, footer: FOOTER, button: { text: "Reply to the invitation" }, examples: EXAMPLES },
  // A guest's WhatsApp reply, passed on to the host. WhatsApp makes the
  // guest's number tappable, which opens a chat with them.
  { kind: "guest_reply", name: tname("guest_reply"), language: "en", body: REPLY, footer: FOOTER, examples: REPLY_EXAMPLES },
];

export function templateFor(kind: TemplateKind): TemplateDefinition {
  return TEMPLATES.find((t) => t.kind === kind)!;
}

// The variable names a template's body uses, in order of first appearance.
export function templateVariables(body: string): string[] {
  return [...new Set([...body.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];
}

// ---------------------------------------------------------------- values

const EVENT: Record<string, string> = { wedding: "wedding", bachelorette: "bachelorette party", birthday: "birthday celebration" };

// Meta rejects variable values with line breaks, tabs or more than four
// spaces in a row, and empty ones; long values are cut.
export function cleanParam(value: string, max = 200): string {
  const s = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
  const cut = s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
  return cut || "—";
}

// The stored time is what the host typed (see lib/calendar.ts), so the date
// is built from those numbers rather than shifted by any timezone.
function dateText(eventDate: string | null): string {
  const t = parseWallClock(eventDate);
  if (!t) return "soon";
  const d = new Date(Date.UTC(t.year, t.month - 1, t.day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `on ${d}`;
}
function seatsText(n: number) {
  return n === 1 ? "1 seat is reserved for you" : `${n} seats are reserved for you`;
}

export type EventInfo = { hostNames: string; category: string | null; eventDate: string | null };

// Every variable any template might use, for one guest; each template picks
// the ones its body has.
function allValues(e: EventInfo, extra: Record<string, string>): Record<string, string> {
  return {
    host_names: e.hostNames,
    event: EVENT[e.category ?? ""] ?? "celebration",
    date_text: dateText(e.eventDate),
    ...extra,
  };
}

export type FilledTemplate = {
  name: string;
  language: "en";
  params: Record<string, string>;
  // The variable end of the button's address ("" when there's no button).
  buttonSuffix: string;
  // A readable copy of the message, for the dashboard and logs.
  preview: string;
};

function fill(t: TemplateDefinition, values: Record<string, string>, buttonSuffix = "", buttonUrl = ""): FilledTemplate {
  const params: Record<string, string> = {};
  for (const key of templateVariables(t.body)) {
    params[key] = cleanParam(values[key] ?? "", key === "message" ? 600 : 200);
  }
  const text = t.body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => params[k] ?? "");
  return {
    name: t.name,
    language: t.language,
    params,
    buttonSuffix,
    preview: `${text}${t.footer ? `\n\n${t.footer}` : ""}${t.button ? `\n\n[${t.button.text}] ${buttonUrl}` : ""}`,
  };
}

export function invitationTemplate(
  e: EventInfo,
  g: { name: string; seats: number },
  link: { siteUrl: string; slug: string; token: string }
): FilledTemplate {
  const suffix = `${link.slug}/g/${link.token}`;
  return fill(
    templateFor("invite"),
    allValues(e, { guest_name: g.name, seats_text: seatsText(g.seats) }),
    suffix,
    `${link.siteUrl}/i/${suffix}`
  );
}

export function reminderTemplate(
  e: EventInfo,
  g: { name: string },
  link: { siteUrl: string; slug: string; token: string }
): FilledTemplate {
  const suffix = `${link.slug}/g/${link.token}`;
  return fill(templateFor("reminder"), allValues(e, { guest_name: g.name }), suffix, `${link.siteUrl}/i/${suffix}`);
}

export function guestReplyTemplate(e: EventInfo, guest: { name: string; phone: string }, text: string): FilledTemplate {
  return fill(templateFor("guest_reply"), allValues(e, { guest_name: guest.name, guest_phone: guest.phone, message: text }));
}

// ------------------------------------------------------- Meta review request
// The body scripts/kapso-templates.ts sends to Kapso to submit one template
// for Meta's approval. Category UTILITY: transactional messages to people who
// expect them. Meta may re-classify; the script reports what it decides.
export function templateRequest(t: TemplateDefinition, siteUrl: string) {
  const site = siteUrl.replace(/\/+$/, "");
  const vars = templateVariables(t.body);
  return {
    name: t.name,
    language: t.language,
    category: "UTILITY",
    parameter_format: "NAMED",
    components: [
      {
        type: "BODY",
        text: t.body,
        example: { body_text_named_params: vars.map((param_name) => ({ param_name, example: t.examples[param_name] ?? "example" })) },
      },
      ...(t.footer ? [{ type: "FOOTER", text: t.footer }] : []),
      ...(t.button
        ? [
            {
              type: "BUTTONS",
              buttons: [
                { type: "URL", text: t.button.text, url: `${site}/i/{{1}}`, example: [`${site}/i/jad-mariana/g/sAmPlEtOkEn1234567890A`] },
              ],
            },
          ]
        : []),
    ],
  };
}
