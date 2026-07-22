import type { BallColor } from "./types";
import { BALLS_PER_POINT, BALL_COLORS } from "./constants";

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
