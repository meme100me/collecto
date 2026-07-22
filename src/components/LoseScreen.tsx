"use client";

interface LoseScreenProps {
  score: number;
  targetScore: number;
  onTryAgain: () => void;
  loading?: boolean;
}

export function LoseScreen({
  score,
  targetScore,
  onTryAgain,
  loading = false,
}: LoseScreenProps) {
  return (
    <section
      className="rounded-3xl border border-[#e2c4a8] bg-gradient-to-br from-[#fff6ee] to-[#f7fbff] p-6 sm:p-8 shadow-lg"
      aria-labelledby="lose-title"
    >
      <h2 id="lose-title" className="text-2xl font-black text-[#7a3b16]">
        לא נותרו מהלכים אפשריים.
      </h2>
      <p className="mt-2 text-[#5d4332]">
        הניקוד שהושג: {score} מתוך {targetScore}
      </p>
      <p className="mt-1 text-sm text-[#7a5a45]">
        הקואורדינטות לא נחשפות ללא השלמת האתגר.
      </p>
      <button
        type="button"
        onClick={onTryAgain}
        disabled={loading}
        className="mt-6 w-full sm:w-auto rounded-xl bg-[#c45c26] text-white px-6 py-3 font-semibold hover:bg-[#a84c1f] disabled:opacity-60"
      >
        {loading ? "יוצר לוח..." : "נסה לוח חדש"}
      </button>
    </section>
  );
}
