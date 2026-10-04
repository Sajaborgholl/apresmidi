import Link from "next/link";
import type { NavCategory } from "@/lib/categories";

// The site nav, shared by the homepage and the /templates pages. On the
// homepage every link scrolls within the page (#how-it-works etc.); anywhere
// else the same links go back to those homepage sections (/#how-it-works),
// and the occasion links open that occasion's template page instead.
export default function SiteHeader({ categories, onHome = false }: { categories: NavCategory[]; onHome?: boolean }) {
  const section = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <nav className="site-nav flex items-center justify-between px-6 md:px-12 py-5">
      <Link href="/" aria-label="Après-midi home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Après-midi" className="h-8 w-auto" />
      </Link>
      {/* Six links need about 1000px beside the logo and button, so the
          three occasion links only join from lg; between md and lg the
          page's own "Browse by occasion" section covers them. */}
      <div className="hidden md:flex gap-6 whitespace-nowrap text-sm font-medium xl:gap-8">
        {categories.slice(0, 3).map((cat) =>
          onHome ? (
            <a key={cat.slug} href={`#occasion-${cat.slug}`} className="hidden hover:opacity-70 lg:inline">
              {cat.name}
            </a>
          ) : (
            <Link key={cat.slug} href={`/templates/${cat.slug}`} className="hidden hover:opacity-70 lg:inline">
              {cat.name}
            </Link>
          )
        )}
        <a href={section("how-it-works")} className="hover:opacity-70">How it works</a>
        <a href={section("what-we-offer")} className="hover:opacity-70">What we offer</a>
        <a href={section("pricing")} className="hover:opacity-70">Plans</a>
      </div>
      <a
        href={section("occasions")}
        className="rounded-full px-5 py-2 text-sm font-medium transition active:scale-[0.97]"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        Browse templates
      </a>
    </nav>
  );
}
