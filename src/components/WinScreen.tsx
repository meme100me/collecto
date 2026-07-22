"use client";

import { useState } from "react";

interface WinScreenProps {
  coordinates: string;
  moves: number;
  onPlayAgain: () => void;
  onBackToInstructions: () => void;
  loading?: boolean;
}

export function WinScreen({
  coordinates,
  moves,
  onPlayAgain,
  onBackToInstructions,
  loading = false,
}: WinScreenProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[#b7d4a8] bg-gradient-to-br from-[#eef8e8] via-[#f7fbff] to-[#e7f3ff] p-6 sm:p-8 shadow-lg animate-celebrate"
      aria-labelledby="win-title"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 confetti-layer" aria-hidden="true" />
      <h2 id="win-title" className="text-3xl font-black text-[#1f5b2d]">
        כל הכבוד!
      </h2>
      <p className="mt-2 text-[#31563a]">
        צברת 5 נקודות והשלמת את האתגר.
      </p>
      <p className="mt-1 text-sm text-[#4d6a52]">מספר מהלכים: {moves}</p>

      <div className="mt-6 rounded-2xl bg-white/90 border border-[#cfe3c4] p-4 shadow-inner">
        <div className="text-xs font-semibold text-[#4d6a52] mb-2">
          הקואורדינטות
        </div>
        <code className="block font-mono text-base sm:text-lg tracking-wide text-[#12324a] break-all dir-ltr text-left">
          {coordinates}
        </code>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded-xl bg-[#1f5b2d] text-white py-3 font-semibold hover:bg-[#174823]"
        >
          {copied ? "הקואורדינטות הועתקו" : "העתק קואורדינטות"}
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          disabled={loading}
          className="flex-1 rounded-xl bg-[#1a4d6d] text-white py-3 font-semibold hover:bg-[#163e57] disabled:opacity-60"
        >
          {loading ? "טוען..." : "שחק שוב"}
        </button>
        <button
          type="button"
          onClick={onBackToInstructions}
          className="flex-1 rounded-xl border border-[#9fb8c9] py-3 font-semibold text-[#1a4d6d] hover:bg-white"
        >
          חזרה להוראות
        </button>
      </div>
    </section>
  );
}
