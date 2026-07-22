import { describe, expect, it } from "vitest";
import { calculateScore, pointsFromCount } from "@/lib/game/scoring";
import { emptyCollected } from "@/lib/game/constants";

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
});
