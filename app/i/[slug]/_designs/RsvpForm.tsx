"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RsvpForm({
  inviteId,
  whatsappNumber,
}: {
  inviteId: string;
  whatsappNumber?: string | null;
}) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("rsvps").insert({
      invite_id: inviteId,
      guest_name: name.trim(),
      attending: attending === "yes",
      guest_count: guestCount,
    });

    setLoading(false);
    if (insertError) {
      setError("Something went wrong — please try again.");
      return;
    }
    setSubmitted(true);
  }

const waMessage = encodeURIComponent(
    `Hi! It's ${name} — ${
      attending === "yes"
        ? `we are beyond excited and wouldn't miss it for the world! We'll be there with ${guestCount} of us. Can't wait to celebrate this special day with you both! 🎉💛`
        : "I'm so sorry we won't be able to make it this time. We're truly disappointed to miss it, but we'll be thinking of you and sending all our love on your special day 💔"
    }`
  );
  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${waMessage}` : null;

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-lg font-medium mb-4">Thank you, {name}! Your RSVP has been recorded 🤍</p>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-full bg-[#25D366] text-white font-medium hover:opacity-90 transition"
          >
            Confirm on WhatsApp too
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <div>
        <label className="block text-sm mb-1">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Full name"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Will you attend?</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAttending("yes")}
            className={`flex-1 py-2 rounded-lg border ${attending === "yes" ? "bg-black text-white" : ""}`}
          >
            Joyfully accept
          </button>
          <button
            type="button"
            onClick={() => setAttending("no")}
            className={`flex-1 py-2 rounded-lg border ${attending === "no" ? "bg-black text-white" : ""}`}
          >
            Regretfully decline
          </button>
        </div>
      </div>

      {attending === "yes" && (
        <div>
          <label className="block text-sm mb-1">Number of guests (incl. you)</label>
          <input
            type="number"
            min={1}
            max={10}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full bg-black text-white font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send RSVP"}
      </button>
    </form>
  );
}
