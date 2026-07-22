"use client";

import type { BallColor, PublicGameState } from "@/lib/game/types";
import {
  BALL_COLORS,
  BALLS_PER_POINT,
  COLOR_LABELS_HE,
} from "@/lib/game/constants";
import { pointsFromCount, remainderTowardNextPoint } from "@/lib/game/scoring";
import { Ball } from "./Ball";

interface ScorePanelProps {
  game: PublicGameState;
}

function pointsLabel(points: number): string {
  if (points === 0) return "אין נקודות";
  if (points === 1) return "נקודה אחת";
  return `${points} נקודות`;
}

export function ScorePanel({ game }: ScorePanelProps) {
  return (
    <section
      aria-label="הכדורים שאספת"
      className="rounded-2xl bg-white/80 backdrop-blur border border-[#d7e3ec] p-4 shadow-sm"
    >
      <h2 className="text-lg font-bold text-[#12324a] mb-3">הכדורים שאספת</h2>
      <ul className="space-y-3">
        {BALL_COLORS.map((color: BallColor) => {
          const count = game.collected[color];
          const points = pointsFromCount(count);
          const rem = remainderTowardNextPoint(count);
          return (
            <li
              key={color}
              className="flex items-center gap-3 text-sm text-[#1d3b50]"
            >
              <Ball color={color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">
                  {COLOR_LABELS_HE[color]}: {count} כדורים
                </div>
                <div className="text-[#4d6577]">
                  {pointsLabel(points)} · {rem} מתוך {BALLS_PER_POINT} לנקודה
                  הבאה
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[#e6eef4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2f80a8] transition-all duration-300"
                    style={{ width: `${(rem / BALLS_PER_POINT) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
