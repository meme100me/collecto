import { describe, expect, it } from "vitest";
import {
  calculateScore,
  countScoringColors,
  meetsWinConditions,
  pointsFromCount,
} from "@/lib/game/scoring";
import { emptyCollected, MIN_SCORING_COLORS, POINT_TARGET } from "@/lib/game/constants";

describe("scoring", () => {
  it.each([
    [0, 0],
    [2, 0],
    [3, 1],
    [5, 1],
    [6, 2],
    [8, 2],
  ])("%i balls => %i points", (balls, points) => {
    expect(pointsFromCount(balls)).toBe(points);
  });

  it("scores each color separately", () => {
    const collected = emptyCollected();
    collected.blue = 2;
    collected.red = 2;
    expect(calculateScore(collected)).toBe(0);

    collected.blue = 3;
    collected.red = 3;
    expect(calculateScore(collected)).toBe(2);

    collected.green = 5;
    expect(calculateScore(collected)).toBe(3);
  });

  it("counts scoring colors at boundaries of 2, 3, and 6 balls", () => {
    const collected = emptyCollected();

    collected.red = 2;
    expect(countScoringColors(collected)).toBe(0);

    collected.red = 3;
    expect(countScoringColors(collected)).toBe(1);

    collected.blue = 6;
    // 6 blues still count as one scoring color for diversity
    expect(pointsFromCount(collected.blue)).toBe(2);
    expect(countScoringColors(collected)).toBe(2);
  });

  it("requires both point target and minimum scoring colors to win", () => {
    const threeColors = emptyCollected();
    threeColors.red = 6;
    threeColors.blue = 6;
    threeColors.green = 3;
    expect(calculateScore(threeColors)).toBe(POINT_TARGET);
    expect(countScoringColors(threeColors)).toBe(3);
    expect(meetsWinConditions(threeColors)).toBe(false);

    const fourColors = emptyCollected();
    fourColors.red = 3;
    fourColors.blue = 3;
    fourColors.green = 3;
    fourColors.yellow = 6;
    expect(calculateScore(fourColors)).toBe(POINT_TARGET);
    expect(countScoringColors(fourColors)).toBe(MIN_SCORING_COLORS);
    expect(meetsWinConditions(fourColors)).toBe(true);
  });
});
