// The request-based plans and the add-ons offered on Plus. One source, read
// by the plan cards in app/_components/Pricing.tsx, the request window in
// PlanRequestDialog.tsx and the validation in app/_actions/premium-inquiry.ts,
// so the three can't drift apart. Plain data with no React or server
// imports, since both a Server and a Client Component import it.
//
// None of the add-ons are built yet: Plus is a request that gets quoted and
// paid by hand, like Premium. There are no per-add-on prices on purpose —
// $180 is a floor and each request is priced after seeing what was picked.
export type InquiryPlan = "plus" | "premium";

// The one self-serve plan, shown on the homepage price card and on every
// template detail page. Its price must match STANDARD_PRICE_USD in
// app/order/[slug]/actions.ts, which is what Whish actually charges.
export const STANDARD_PLAN = {
  name: "Standard",
  price: "$80",
  features: ["Your chosen template, exactly as designed", "Live guest RSVP page", "Private RSVP dashboard"],
};

export const REQUEST_PLANS: Record<InquiryPlan, { name: string; price: string; intro: string }> = {
  plus: {
    name: "Plus",
    price: "$180",
    intro: "Pick the extras you'd like and we'll send you a quote.",
  },
  premium: {
    name: "Premium",
    price: "$280",
    intro: "Tell us about your event and we'll set up a 1:1 call to plan your design together.",
  },
};

export const PLUS_ADDON_GROUPS = [
  {
    group: "Media",
    addons: [
      { name: "Background music", description: "A song that plays as guests open the invite" },
      { name: "Video", description: "A short clip or save-the-date on the invite" },
      { name: "Extra photos", description: "More photos, in a swipeable gallery" },
    ],
  },
  {
    group: "Guest experience",
    addons: [
      { name: "Countdown", description: "A live timer to your day" },
      { name: "Add to calendar", description: "One tap to save the date" },
      { name: "Event schedule", description: "The timeline of your day" },
      { name: "Guest wishes", description: "Guests leave a message with their RSVP" },
    ],
  },
  {
    group: "Personal touches",
    addons: [
      { name: "Arabic or bilingual", description: "Your invite in Arabic, or Arabic and English" },
      { name: "Custom link", description: "A link with your names, no random code" },
      { name: "Custom colours", description: "The design recoloured to your palette" },
      { name: "Dress code & details", description: "Dress code, parking, gifts and more" },
    ],
  },
] as const;

// Names only — what the form submits and the server action accepts.
export const PLUS_ADDONS: readonly string[] = PLUS_ADDON_GROUPS.flatMap((g) => g.addons.map((a) => a.name));
