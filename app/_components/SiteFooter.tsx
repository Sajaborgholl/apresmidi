import Link from "next/link";
import Reveal from "./Reveal";
import type { NavCategory } from "@/lib/categories";
import { BUSINESS_WHATSAPP_NUMBER } from "@/lib/contact";

// The blue site footer, shared by the homepage and the /templates pages.
// The old "Subscribe" box wasn't wired to anything (visitors thought they'd
// signed up), so the space now helps hosts back into their dashboard.
export default function SiteFooter({ categories }: { categories: NavCategory[] }) {
  return (
    <footer className="px-6 md:px-12 py-14 mt-8" style={{ background: "var(--blue)" }}>
      <Reveal>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h3 className="display font-bold text-2xl md:text-3xl max-w-md">Already have an invitation?</h3>
          <p className="mt-1.5 text-sm opacity-70">Lost your dashboard link? We&apos;ll email it to you again.</p>
        </div>
        <Link
          href="/dashboard/recover"
          className="self-start rounded-full px-6 py-3 font-medium transition active:scale-[0.97] md:self-auto"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          Get my dashboard link
        </Link>
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
          <a href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
            WhatsApp us
          </a>
        </div>
      </div>
    </footer>
  );
}
