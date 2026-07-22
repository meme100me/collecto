import { describe, expect, it } from "vitest";
import {
  createStateToken,
  verifyStateToken,
} from "@/lib/server/state-token";
import {
  applyGameMove,
  createInitialGameState,
  shouldRevealCoordinates,
} from "@/lib/game/game-engine";
import {
  MIN_SCORING_COLORS,
  POINT_TARGET,
  emptyCollected,
} from "@/lib/game/constants";
import { createEmptyBoard } from "@/lib/game/push-line";
import type { GameState } from "@/lib/game/types";
import { getCacheCoordinates } from "@/lib/server/environment";
import { calculateScore, countScoringColors } from "@/lib/game/scoring";

const SECRET = "test-secret-value-32chars-minimum!";

describe("state-token security", () => {
  it("accepts a valid token", () => {
    const state = createInitialGameState("token-seed-1");
    const token = createStateToken(state, SECRET);
    const verified = verifyStateToken(token, SECRET);
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.state.gameId).toBe(state.gameId);
      expect(verified.state.seed).toBe(state.seed);
    }
  });

  it("rejects a token with one character changed", () => {
    const state = createInitialGameState("token-seed-2");
    const token = createStateToken(state, SECRET);
    const chars = token.split("");
    const flipIndex = chars.findIndex((c) => /[A-Za-z0-9]/.test(c));
    chars[flipIndex] = chars[flipIndex] === "A" ? "B" : "A";
    const tampered = chars.join("");
    const verified = verifyStateToken(tampered, SECRET);
    expect(verified.ok).toBe(false);
  });

  it("rejects unsigned state mutation", () => {
    const state = createInitialGameState("token-seed-3");
    const token = createStateToken(state, SECRET);
    const [payload] = token.split(".");
    const fake = `${payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    expect(verifyStateToken(fake, SECRET).ok).toBe(false);
  });

  it("rejects an expired token", () => {
    const state = createInitialGameState("token-seed-4");
    state.createdAt = Date.now() - 25 * 60 * 60 * 1000;
    const token = createStateToken(state, SECRET);
    const verified = verifyStateToken(token, SECRET);
    expect(verified.ok).toBe(false);
    if (!verified.ok) {
      expect(verified.status).toBe(401);
    }
  });

  it("does not allow moves after the game ended", () => {
    const state = createInitialGameState("token-seed-5");
    const ended: GameState = { ...state, phase: "won", score: POINT_TARGET };
    const result = applyGameMove(ended, {
      axis: "row",
      index: 0,
      direction: "left",
    });
    expect(result.valid).toBe(false);
  });

  it("coordinates are only available after a verified multi-color win", () => {
    process.env.CACHE_COORDINATES = "N 11° 22.333 E 044° 55.666";
    const coords = getCacheCoordinates();
    expect(coords).toContain("11°");

    const threeColorCollected = emptyCollected();
    threeColorCollected.red = 6;
    threeColorCollected.blue = 6;
    threeColorCollected.green = 3;
    expect(calculateScore(threeColorCollected)).toBe(POINT_TARGET);
    expect(countScoringColors(threeColorCollected)).toBe(3);

    const incomplete: GameState = {
      version: 1,
      gameId: "coord-incomplete",
      seed: "c",
      board: createEmptyBoard(),
      collected: threeColorCollected,
      score: POINT_TARGET,
      moves: 10,
      phase: "normal",
      createdAt: Date.now(),
    };
    expect(shouldRevealCoordinates(incomplete)).toBe(false);
    expect(shouldRevealCoordinates({ ...incomplete, phase: "won" })).toBe(
      false,
    );

    const fourColorCollected = emptyCollected();
    fourColorCollected.red = 3;
    fourColorCollected.blue = 3;
    fourColorCollected.green = 3;
    fourColorCollected.yellow = 6;
    expect(countScoringColors(fourColorCollected)).toBe(MIN_SCORING_COLORS);

    const winningState: GameState = {
      version: 1,
      gameId: "coord-win",
      seed: "c",
      board: createEmptyBoard(),
      collected: fourColorCollected,
      score: calculateScore(fourColorCollected),
      moves: 10,
      phase: "won",
      createdAt: Date.now(),
    };
    expect(shouldRevealCoordinates(winningState)).toBe(true);
    expect(coords).toBe(process.env.CACHE_COORDINATES);
  });
});
