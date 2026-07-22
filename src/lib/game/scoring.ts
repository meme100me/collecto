import type { BallColor } from "./types";
import {
  BALLS_PER_POINT,
  BALL_COLORS,
  MIN_SCORING_COLORS,
  POINT_TARGET,
} from "./constants";

export function pointsFromCount(count: number): number {
  return Math.floor(count / BALLS_PER_POINT);
}

export function remainderTowardNextPoint(count: number): number {
  return count % BALLS_PER_POINT;
}

export function calculateScore(
  collected: Record<BallColor, number>,
): number {
  return BALL_COLORS.reduce(
    (sum, color) => sum + pointsFromCount(collected[color]),
    0,
  );
}

/** Colors that already earned at least one point (not merely a collected ball). */
export function countScoringColors(
  collected: Record<BallColor, number>,
): number {
  return BALL_COLORS.reduce((count, color) => {
    return count + (pointsFromCount(collected[color]) >= 1 ? 1 : 0);
  }, 0);
}

export function colorHasScored(
  collected: Record<BallColor, number>,
  color: BallColor,
): boolean {
  return pointsFromCount(collected[color]) >= 1;
}

export function meetsWinConditions(
  collected: Record<BallColor, number>,
): boolean {
  return (
    calculateScore(collected) >= POINT_TARGET &&
    countScoringColors(collected) >= MIN_SCORING_COLORS
  );
}

export function mergeCollected(
  current: Record<BallColor, number>,
  gained: Record<BallColor, number>,
): Record<BallColor, number> {
  const next = { ...current };
  for (const color of BALL_COLORS) {
    next[color] += gained[color];
  }
  return next;
}
