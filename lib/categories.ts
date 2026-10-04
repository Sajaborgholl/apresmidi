import type { getSupabaseAdmin } from "@/lib/supabase";

export type NavCategory = { slug: string; name: string };

// The occasions shown in the site nav, the homepage's occasion grid and the
// footer. One query shared by the homepage and the /templates pages, so the
// header and footer list the same occasions wherever they appear.
//
// Temporarily hides "Baptism" (no templates ready for it yet). Remove the
// filter to bring it back once there's at least one baptism template.
export async function getVisibleCategories(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const { data } = await supabaseAdmin
    .from("categories")
    .select("slug, name, price, sort_order")
    .order("sort_order", { ascending: true });
  return (data ?? []).filter((c) => c.slug !== "baptism") as {
    slug: string;
    name: string;
    price: number | null;
    sort_order: number | null;
  }[];
}

// The site's three accent colours, cycled across cards so any number of
// categories or templates still alternates evenly.
export const CARD_COLORS = ["var(--blue)", "var(--yellow)", "var(--blue-light)"];
