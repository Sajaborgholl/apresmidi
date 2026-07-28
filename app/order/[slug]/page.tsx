import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { createOrder } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: template } = await supabaseAdmin
    .from("templates")
    .select("id, slug, name, category")
    .eq("slug", slug)
    .single();

  if (!template) notFound();

  const { data: categoryRow } = await supabaseAdmin
    .from("categories")
    .select("name, price")
    .eq("slug", template.category)
    .single();

  // Binds the template slug to the server action so the form doesn't need
  // a hidden input for it.
  const submitOrder = createOrder.bind(null, template.slug);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Order: {template.name}
      </h1>
      {categoryRow && (
        <p className="mt-1 text-neutral-600">
          ${categoryRow.price} — {categoryRow.name}
        </p>
      )}

      <form action={submitOrder} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">
            Host names *
          </span>
          <input
            name="host_names"
            required
            placeholder="Sarah & Karim"
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">
            Event date &amp; time
          </span>
          <input
            name="event_date"
            type="datetime-local"
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">
            Venue name
          </span>
          <input
            name="venue_name"
            placeholder="Merchak Rooftop"
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">
            Venue Google Maps link
          </span>
          <input
            name="venue_map_url"
            type="url"
            placeholder="https://maps.google.com/..."
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">
            WhatsApp number (for RSVP confirmations)
          </span>
          <input
            name="whatsapp_number"
            placeholder="+961..."
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-full bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-800"
        >
          Continue to payment
        </button>
      </form>
    </main>
  );
}
