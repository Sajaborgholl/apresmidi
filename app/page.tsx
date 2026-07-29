export default function Home() {
  return (
    <div className="overflow-x-hidden" style={{ background: "var(--cream)", color: "var(--ink)", fontFamily: "Inter, sans-serif" }}>
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <span className="script text-3xl">yourbrand</span>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#" className="hover:opacity-70">Weddings</a>
          <a href="#" className="hover:opacity-70">Birthdays</a>
          <a href="#" className="hover:opacity-70">Baptisms</a>
          <a href="#" className="hover:opacity-70">How it works</a>
        </div>
        <button className="rounded-full px-5 py-2 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--cream)" }}>
          Browse templates
        </button>
      </nav>

      <section className="relative px-6 md:px-12 pt-8 pb-20 overflow-hidden">
        <h1 className="display font-bold leading-[0.85] tracking-tight select-none" style={{ fontSize: "clamp(3rem,10vw,9rem)" }}>
          <span className="block">Invitations</span>
          <span className="block -mt-2 md:-mt-6" style={{ marginLeft: "8%", color: "var(--blue-dark)" }}>worth</span>
          <span className="block -mt-2 md:-mt-6">opening</span>
        </h1>

        <div className="mt-10 grid grid-cols-6 md:grid-cols-12 gap-3 relative">
          <div className="col-span-3 md:col-span-3 rounded-3xl h-32 md:h-44" style={{ background: "var(--blue)" }} />
          <div className="col-span-3 md:col-span-2 rounded-3xl h-32 md:h-44 relative" style={{ background: "var(--yellow)" }}>
            <span className="absolute -top-3 -left-3 rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--ink)", color: "var(--cream)" }}>
              New: Baptism
            </span>
          </div>
          <div className="col-span-6 md:col-span-4 rounded-3xl h-32 md:h-44" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }} />
          <div className="col-span-3 md:col-span-3 rounded-3xl h-32 md:h-44 float" style={{ background: "var(--blue-light)" }} />

          <div className="col-span-6 md:col-span-3 rounded-2xl p-4 md:p-5 flex flex-col justify-between float" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--blue-dark)" }}>Live now</span>
            <span className="display font-bold text-2xl">120+ invites sent</span>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-10 flex flex-wrap items-center gap-3 justify-center">
        <span className="rounded-full px-5 py-2 font-medium" style={{ background: "var(--blue)" }}>Pick</span>
        <span className="text-lg">a template</span>
        <span className="display">→</span>
        <span className="rounded-full px-5 py-2 font-medium" style={{ background: "var(--yellow)" }}>Personalize</span>
        <span className="text-lg">it</span>
        <span className="display">→</span>
        <span className="rounded-full px-5 py-2 font-medium" style={{ background: "var(--blue)" }}>Share</span>
        <span className="text-lg">the link</span>
      </section>

      <section className="px-6 md:px-12 py-14">
        <div className="flex items-baseline gap-3 mb-8">
          <span className="text-xs font-medium px-3 py-1 rounded-full border" style={{ borderColor: "var(--ink)" }}>01</span>
          <h2 className="display font-bold text-2xl md:text-3xl">Browse by occasion</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="folded-card rounded-3xl p-6 h-56 flex flex-col justify-between" style={{ background: "var(--blue)" }}>
            <span className="display font-bold text-xl">Wedding</span>
            <span className="text-sm font-medium">From $120</span>
          </div>
          <div className="folded-card rounded-3xl p-6 h-56 flex flex-col justify-between" style={{ background: "var(--yellow)" }}>
            <span className="display font-bold text-xl">Birthday</span>
            <span className="text-sm font-medium">From $80</span>
          </div>
          <div className="folded-card rounded-3xl p-6 h-56 flex flex-col justify-between" style={{ background: "var(--blue-light)" }}>
            <span className="display font-bold text-xl">Baptism</span>
            <span className="text-sm font-medium">From $70</span>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14">
        <div className="flex items-baseline gap-3 mb-8">
          <span className="text-xs font-medium px-3 py-1 rounded-full border" style={{ borderColor: "var(--ink)" }}>02</span>
          <h2 className="display font-bold text-2xl md:text-3xl">Recently designed</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="md:col-span-2 rounded-3xl h-72" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }} />
          <div className="rounded-3xl h-72 p-6 flex flex-col justify-center" style={{ background: "var(--blue)" }}>
            <p className="script text-3xl leading-tight">&quot;the moment they said yes&quot;</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          <div className="shrink-0 w-24 h-24 rounded-full" style={{ background: "var(--yellow)" }} />
          <div className="shrink-0 w-24 h-24 rounded-full" style={{ background: "var(--blue)" }} />
          <div className="shrink-0 w-24 h-24 rounded-full" style={{ background: "var(--blue-light)" }} />
          <div className="shrink-0 w-24 h-24 rounded-full" style={{ background: "var(--yellow)" }} />
          <div className="shrink-0 w-24 h-24 rounded-full" style={{ background: "var(--blue)" }} />
        </div>
      </section>

      <section className="px-6 md:px-12 py-16">
        <h2 className="leading-none">
          <span className="display font-bold block" style={{ fontSize: "clamp(2.5rem,8vw,6rem)" }}>Or find it</span>
          <span className="script block" style={{ fontSize: "clamp(3rem,10vw,7rem)", color: "var(--blue-dark)" }}>by style</span>
        </h2>
        <div className="mt-8 divide-y" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between py-4">
            <span className="text-lg font-medium">Elegant</span>
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--blue)" }}>→</span>
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-lg font-medium">Playful</span>
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--yellow)" }}>→</span>
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-lg font-medium">Minimal</span>
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--blue)" }}>→</span>
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-lg font-medium">Rustic</span>
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--yellow)" }}>→</span>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14 grid md:grid-cols-3 gap-6">
        <div className="rounded-3xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="w-10 h-10 rounded-full mb-4" style={{ background: "var(--blue)", border: "3px solid var(--blue-dark)" }} />
          <p className="text-sm">&quot;Guests loved the link, so easy to RSVP.&quot;</p>
          <p className="text-xs mt-3 opacity-60">— Sarah, Wedding</p>
        </div>
        <div className="rounded-3xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="w-10 h-10 rounded-full mb-4" style={{ background: "var(--yellow)", border: "3px solid var(--yellow-dark)" }} />
          <p className="text-sm">&quot;Set up in ten minutes, looked amazing.&quot;</p>
          <p className="text-xs mt-3 opacity-60">— Karim, Birthday</p>
        </div>
        <div className="rounded-3xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="w-10 h-10 rounded-full mb-4" style={{ background: "var(--blue)", border: "3px solid var(--blue-dark)" }} />
          <p className="text-sm">&quot;Exactly the vibe we wanted for the baptism.&quot;</p>
          <p className="text-xs mt-3 opacity-60">— Layla&apos;s family</p>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-14 mt-8" style={{ background: "var(--blue)" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <h3 className="display font-bold text-2xl md:text-3xl max-w-md">Get notified when we add new templates</h3>
          <div className="flex gap-3">
            <input type="email" placeholder="you@email.com" className="rounded-full px-5 py-3 w-64" style={{ border: "1px solid rgba(0,0,0,0.15)" }} />
            <button className="rounded-full px-6 py-3 font-medium" style={{ background: "var(--ink)", color: "var(--cream)" }}>Subscribe</button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-10 pt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <span className="script text-2xl">yourbrand</span>
          <div className="flex gap-6 text-sm">
            <a href="#">Wedding</a><a href="#">Birthday</a><a href="#">Baptism</a>
          </div>
          <div className="flex gap-4 text-sm">
            <a href="#">Instagram</a><a href="#">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
