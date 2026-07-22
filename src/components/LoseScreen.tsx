"use client";

import { MIN_SCORING_COLORS, MOVE_LIMIT, POINT_TARGET } from "@/lib/game/constants";

interface LoseScreenProps {
  score: number;
  targetScore: number;
  scoringColorCount: number;
  requiredScoringColors: number;
  moves: number;
  moveLimit: number;
  detailMessage?: string;
  onTryAgain: () => void;
  loading?: boolean;
}

export function LoseScreen({
  score,
  targetScore,
  scoringColorCount,
  requiredScoringColors,
  moves,
  moveLimit,
  detailMessage,
  onTryAgain,
  loading = false,
}: LoseScreenProps) {
  const hitMoveLimit = moves >= moveLimit;
  const missingColors =
    score >= targetScore && scoringColorCount < requiredScoringColors;

  let title = "לא נותרו מהלכים אפשריים.";
  if (hitMoveLimit) {
    title = `נגמרו ${moveLimit || MOVE_LIMIT} הניסיונות.`;
  }

  let explanation: string;
  if (missingColors) {
    explanation = `הגעת ל-${targetScore || POINT_TARGET} נקודות, אך דרישת ${requiredScoringColors || MIN_SCORING_COLORS} הצבעים עדיין לא הושלמה (${scoringColorCount} מתוך ${requiredScoringColors}).`;
  } else if (hitMoveLimit) {
    explanation = `הניקוד שהושג: ${score} מתוך ${targetScore}. צבעים מנוקדים: ${scoringColorCount} מתוך ${requiredScoringColors}.`;
  } else {
    explanation = `הניקוד שהושג: ${score} מתוך ${targetScore}`;
  }

  return (
    <section
      className="rounded-3xl border border-[#e2c4a8] bg-gradient-to-br from-[#fff6ee] to-[#f7fbff] p-6 sm:p-8 shadow-lg"
      aria-labelledby="lose-title"
    >
      <h2 id="lose-title" className="text-2xl font-black text-[#7a3b16]">
        {title}
      </h2>
      <p className="mt-2 text-[#5d4332]">{explanation}</p>
      {detailMessage && detailMessage !== explanation && (
        <p className="mt-2 text-sm text-[#7a5a45]">{detailMessage}</p>
      )}
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
