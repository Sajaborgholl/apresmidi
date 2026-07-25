export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#FBF7F2]">
      <h1 className="text-3xl font-serif mb-4 text-[#7A5C3E]">Your Invitation Brand</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        This is your homepage / showcase page. Once you seed a demo invite,
        it will live at /i/your-slug — that&apos;s the link you send clients
        and post on Instagram.
      </p>
      <a
        href="/i/sarah-karim"
        className="px-6 py-3 rounded-full bg-black text-white hover:opacity-90 transition"
      >
        View demo invite →
      </a>
    </main>
  );
}
