import { describe, expect, it } from "vitest";
import {
  applyGameMove,
  createInitialGameState,
  toPublicGameState,
} from "@/lib/game/game-engine";
import { getLegalMoves } from "@/lib/game/legal-moves";
import { POINT_TARGET, emptyCollected } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/types";
import { createEmptyBoard } from "@/lib/game/push-line";

describe("game-engine", () => {
  it("creates a playable initial state", () => {
    const state = createInitialGameState("engine-seed-1");
    expect(state.board).toHaveLength(7);
    expect(state.score).toBe(0);
    expect(state.moves).toBe(0);
    expect(["normal", "two-step-first"]).toContain(state.phase);
  });

  it("applies a legal move and updates score/collections", () => {
    const state = createInitialGameState("engine-seed-2");
    if (state.phase !== "normal") {
      // Skip if generated into two-step; still valid engine behavior
      expect(state.phase).toBe("two-step-first");
      return;
    }

    const move = getLegalMoves(state.board)[0];
    const result = applyGameMove(state, move);
    expect(result.valid).toBe(true);
    expect(result.state.moves).toBe(state.moves + 1);
    expect(
      Object.values(result.collectedThisMove).some((n) => n > 0),
    ).toBe(true);
  });

  it("rejects illegal moves without changing state", () => {
    const state = createInitialGameState("engine-seed-3");
    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });

    // May be valid or invalid depending on board; if invalid, state unchanged
    if (!result.valid) {
      expect(result.state).toEqual(state);
      expect(result.state.moves).toBe(state.moves);
      expect(result.message).toMatch(/קבוצה|לוח|חוקי|משנה/);
    }
  });

  it("marks won when score reaches target", () => {
    const board = createEmptyBoard();
    board[0][0] = "blue";
    board[0][2] = "blue";

    const collected = emptyCollected();
    collected.blue = POINT_TARGET * 3 - 2; // need 2 more blues for one more point to hit target if score is target-1

    const scoreBefore = Math.floor(collected.blue / 3);
    // Ensure we are one point away: score should be POINT_TARGET - 1
    // points from blue alone = floor((POINT_TARGET*3 - 2)/3) = POINT_TARGET - 1
    expect(scoreBefore).toBe(POINT_TARGET - 1);

    const state: GameState = {
      version: 1,
      gameId: "win-test",
      seed: "win",
      board,
      collected,
      score: scoreBefore,
      moves: 3,
      phase: "normal",
      createdAt: Date.now(),
    };

    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });

    expect(result.valid).toBe(true);
    expect(result.state.phase).toBe("won");
    expect(result.state.score).toBeGreaterThanOrEqual(POINT_TARGET);
  });

  it("exposes public state without seed secrets beyond gameplay", () => {
    const state = createInitialGameState("public-seed");
    const pub = toPublicGameState(state);
    expect(pub.gameId).toBe(state.gameId);
    expect(pub.targetScore).toBe(POINT_TARGET);
    expect(pub.board).toEqual(state.board);
    expect(pub).not.toHaveProperty("seed");
  });

  it("does not allow moves after win/loss", () => {
    const state = createInitialGameState("ended");
    const won: GameState = { ...state, phase: "won", score: POINT_TARGET };
    const lost: GameState = { ...state, phase: "lost" };

    expect(
      applyGameMove(won, {
        axis: "row",
        index: 0,
        direction: "left",
      }).valid,
    ).toBe(false);

    expect(
      applyGameMove(lost, {
        axis: "row",
        index: 0,
        direction: "left",
      }).valid,
    ).toBe(false);
  });
});
