import Link from "next/link";
import Reveal from "./Reveal";
import type { NavCategory } from "@/lib/categories";

// The blue site footer, shared by the homepage and the /templates pages.
// Known loose ends, unchanged from when it lived inline in app/page.tsx: the
// subscribe box isn't wired to anything yet, and Instagram/WhatsApp are
// placeholder links.
export default function SiteFooter({ categories }: { categories: NavCategory[] }) {
  return (
    <footer className="px-6 md:px-12 py-14 mt-8" style={{ background: "var(--blue)" }}>
      <Reveal>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <h3 className="display font-bold text-2xl md:text-3xl max-w-md">Get notified when we add new templates</h3>
        {/* The input shrinks on phones: a fixed 256px box plus the button was
            wider than a 375px screen and pushed Subscribe off the edge. */}
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="you@email.com"
            className="rounded-full px-5 py-3 w-full min-w-0 sm:w-64"
            style={{ border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "var(--ink)" }}
          />
          <button
            className="rounded-full px-6 py-3 font-medium transition active:scale-[0.97]"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            Subscribe
          </button>
        </div>
      </div>
      </Reveal>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-10 pt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Après-midi" className="h-7 w-auto" />
        <div className="flex gap-6 text-sm">
          {categories.slice(0, 3).map((cat) => (
            <Link key={cat.slug} href={`/templates/${cat.slug}`}>
              {cat.name}
            </Link>
          ))}
        </div>
        <div className="flex gap-4 text-sm">
          <a href="#">Instagram</a>
          <a href="#">WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}
