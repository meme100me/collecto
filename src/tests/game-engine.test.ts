import { describe, expect, it } from "vitest";
import {
  applyGameMove,
  createInitialGameState,
  shouldRevealCoordinates,
  toPublicGameState,
} from "@/lib/game/game-engine";
import { getLegalMoves } from "@/lib/game/legal-moves";
import {
  emptyCollected,
  MIN_SCORING_COLORS,
  MOVE_LIMIT,
  POINT_TARGET,
} from "@/lib/game/constants";
import type { Board, GameState, Move } from "@/lib/game/types";
import { createEmptyBoard } from "@/lib/game/push-line";
import { calculateScore, countScoringColors } from "@/lib/game/scoring";
import {
  getTwoStepOptions,
  getValidPreparationMoves,
} from "@/lib/game/two-step";

function makeState(overrides: Partial<GameState> & { board: Board }): GameState {
  return {
    version: 1,
    gameId: "test-game",
    seed: "test",
    collected: emptyCollected(),
    score: 0,
    moves: 0,
    phase: "normal",
    createdAt: Date.now(),
    ...overrides,
  };
}

function nearlyWonCollectedThreeColors(): Record<
  "red" | "blue" | "green" | "yellow" | "purple" | "orange",
  number
> {
  const collected = emptyCollected();
  collected.red = 6;
  collected.blue = 6;
  collected.green = 3;
  return collected;
}

function winningFourColorCollected(): Record<
  "red" | "blue" | "green" | "yellow" | "purple" | "orange",
  number
> {
  const collected = emptyCollected();
  collected.red = 3;
  collected.blue = 3;
  collected.green = 3;
  collected.yellow = 6;
  return collected;
}

describe("game-engine", () => {
  it("creates a playable initial state", () => {
    const state = createInitialGameState("engine-seed-1");
    expect(state.board).toHaveLength(7);
    expect(state.score).toBe(0);
    expect(state.moves).toBe(0);
    expect(["normal", "two-step-first"]).toContain(state.phase);
  });

  it("applies a legal move and updates score/collections once", () => {
    const state = createInitialGameState("engine-seed-2");
    if (state.phase !== "normal") {
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

  it("counts an illegal move toward the attempt limit", () => {
    const board = createEmptyBoard();
    board[0][0] = "red";
    board[0][2] = "blue";
    board[1][0] = "green";
    const state = makeState({ board, moves: 2, phase: "normal" });

    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });

    expect(result.valid).toBe(false);
    expect(result.state.moves).toBe(3);
    expect(result.state.board).toEqual(board);
    expect(result.message).toMatch(/נספר כניסיון/);
    expect(result.message).toMatch(/נותרו 12 ניסיונות/);
  });

  it("wins with 5 points across four scoring colors within the move limit", () => {
    const board = createEmptyBoard();
    board[0][0] = "yellow";
    board[0][2] = "yellow";

    const collected = emptyCollected();
    collected.red = 6;
    collected.blue = 6;
    collected.green = 3;
    collected.yellow = 1;
    // score 5 from three colors; collecting 2 yellow → yellow scores → 4 colors

    const state = makeState({
      board,
      collected,
      score: calculateScore(collected),
      moves: 4,
      phase: "normal",
    });
    expect(state.score).toBe(POINT_TARGET);
    expect(countScoringColors(collected)).toBe(3);

    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });

    expect(result.valid).toBe(true);
    expect(result.state.phase).toBe("won");
    expect(result.state.score).toBeGreaterThanOrEqual(POINT_TARGET);
    expect(countScoringColors(result.state.collected)).toBeGreaterThanOrEqual(
      MIN_SCORING_COLORS,
    );
    expect(result.state.moves).toBeLessThanOrEqual(MOVE_LIMIT);
    expect(shouldRevealCoordinates(result.state)).toBe(true);
  });

  it("does not win with 5 points in only three scoring colors", () => {
    const board = createEmptyBoard();
    board[0][0] = "red";
    board[0][2] = "blue";
    board[2][0] = "green";
    board[2][2] = "yellow";

    const collected = nearlyWonCollectedThreeColors();
    const state = makeState({
      board,
      collected,
      score: calculateScore(collected),
      moves: 3,
      phase: "normal",
    });

    expect(state.score).toBe(POINT_TARGET);
    expect(countScoringColors(collected)).toBe(3);
    expect(state.phase).not.toBe("won");

    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });

    // Whatever happens, three scoring colors alone must not produce a win
    if (result.valid) {
      expect(result.state.phase).not.toBe("won");
      expect(shouldRevealCoordinates(result.state)).toBe(false);
    } else {
      expect(result.state.phase).not.toBe("won");
    }

    const stuck = makeState({
      board: createEmptyBoard(),
      collected,
      score: POINT_TARGET,
      moves: 3,
      phase: "normal",
    });
    expect(shouldRevealCoordinates({ ...stuck, phase: "normal" })).toBe(false);
    expect(countScoringColors(stuck.collected)).toBe(3);
  });

  it("increments the move counter only once for a legal move", () => {
    const board = createEmptyBoard();
    board[0][0] = "blue";
    board[0][2] = "blue";
    const state = makeState({ board, moves: 5 });
    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });
    expect(result.valid).toBe(true);
    expect(result.state.moves).toBe(6);
  });

  it("counts preparation and second move as two separate attempts", () => {
    // Build a two-step-only board via search (same approach as two-step tests)
    let twoStepBoard: Board | null = null;
    for (let a = 0; a < 49 && !twoStepBoard; a += 1) {
      for (let b = a + 1; b < 49; b += 1) {
        const r1 = Math.floor(a / 7);
        const c1 = a % 7;
        const r2 = Math.floor(b / 7);
        const c2 = b % 7;
        if ((r1 === 3 && c1 === 3) || (r2 === 3 && c2 === 3)) continue;
        const trial = createEmptyBoard();
        trial[r1][c1] = "blue";
        trial[r2][c2] = "blue";
        trial[6][0] = "red";
        trial[6][2] = "green";
        trial[6][4] = "yellow";
        trial[0][6] = "orange";
        trial[2][6] = "purple";
        if (getLegalMoves(trial).length > 0) continue;
        if (getTwoStepOptions(trial).length > 0) {
          twoStepBoard = trial;
          break;
        }
      }
    }
    expect(twoStepBoard).not.toBeNull();

    const state = makeState({
      board: twoStepBoard!,
      phase: "two-step-first",
      moves: 0,
    });
    const prep = getValidPreparationMoves(twoStepBoard!)[0];
    const first = applyGameMove(state, prep);
    expect(first.valid).toBe(true);
    expect(first.state.moves).toBe(1);
    expect(first.state.phase).toBe("two-step-second");

    const secondMove = first.legalMoveHints![0] as Move;
    const second = applyGameMove(first.state, secondMove);
    expect(second.valid).toBe(true);
    expect(second.state.moves).toBe(2);
  });

  it("allows a win on the 15th attempt", () => {
    const board = createEmptyBoard();
    board[0][0] = "yellow";
    board[0][2] = "yellow";

    const collected = emptyCollected();
    collected.red = 6;
    collected.blue = 6;
    collected.green = 3;
    collected.yellow = 1;

    const state = makeState({
      board,
      collected,
      score: calculateScore(collected),
      moves: MOVE_LIMIT - 1,
      phase: "normal",
    });

    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });

    expect(result.valid).toBe(true);
    expect(result.state.moves).toBe(MOVE_LIMIT);
    expect(result.state.phase).toBe("won");
    expect(shouldRevealCoordinates(result.state)).toBe(true);
  });

  it("ends in loss when win conditions are unmet after the 15th attempt", () => {
    const board = createEmptyBoard();
    board[0][0] = "red";
    board[0][2] = "blue";
    const state = makeState({
      board,
      moves: MOVE_LIMIT - 1,
      phase: "normal",
    });

    const result = applyGameMove(state, {
      axis: "row",
      index: 0,
      direction: "left",
    });

    expect(result.state.moves).toBe(MOVE_LIMIT);
    expect(result.state.phase).toBe("lost");
    expect(shouldRevealCoordinates(result.state)).toBe(false);
    expect(result.message).toMatch(/נספר כניסיון|נגמרו/);
  });

  it("does not allow moves after loss", () => {
    const state = createInitialGameState("ended-loss");
    const lost: GameState = { ...state, phase: "lost", moves: MOVE_LIMIT };
    const result = applyGameMove(lost, {
      axis: "row",
      index: 0,
      direction: "left",
    });
    expect(result.valid).toBe(false);
    expect(result.state.moves).toBe(MOVE_LIMIT);
    expect(result.state.phase).toBe("lost");
  });

  it("does not reveal coordinates when score is 5 with fewer than four scoring colors", () => {
    const collected = nearlyWonCollectedThreeColors();
    const state = makeState({
      board: createEmptyBoard(),
      collected,
      score: POINT_TARGET,
      moves: 8,
      phase: "normal",
    });

    expect(countScoringColors(collected)).toBe(3);
    expect(shouldRevealCoordinates(state)).toBe(false);
    expect(shouldRevealCoordinates({ ...state, phase: "won" })).toBe(false);
  });

  it("reveals coordinates only after a verified win", () => {
    const collected = winningFourColorCollected();
    const won = makeState({
      board: createEmptyBoard(),
      collected,
      score: calculateScore(collected),
      moves: 10,
      phase: "won",
    });
    expect(won.score).toBeGreaterThanOrEqual(POINT_TARGET);
    expect(countScoringColors(collected)).toBeGreaterThanOrEqual(
      MIN_SCORING_COLORS,
    );
    expect(shouldRevealCoordinates(won)).toBe(true);

    const notWon = { ...won, phase: "normal" as const };
    expect(shouldRevealCoordinates(notWon)).toBe(false);
  });

  it("returns correct movesRemaining in public state", () => {
    const state = createInitialGameState("public-moves");
    const pub = toPublicGameState({ ...state, moves: 7 });
    expect(pub.moveLimit).toBe(MOVE_LIMIT);
    expect(pub.movesRemaining).toBe(MOVE_LIMIT - 7);
    expect(pub.requiredScoringColors).toBe(MIN_SCORING_COLORS);
    expect(pub.scoringColorCount).toBe(0);
    expect(pub).not.toHaveProperty("seed");
  });

  it("exposes public state without seed secrets beyond gameplay", () => {
    const state = createInitialGameState("public-seed");
    const pub = toPublicGameState(state);
    expect(pub.gameId).toBe(state.gameId);
    expect(pub.targetScore).toBe(POINT_TARGET);
    expect(pub.board).toEqual(state.board);
    expect(pub).not.toHaveProperty("seed");
  });

  it("does not allow moves after win", () => {
    const state = createInitialGameState("ended");
    const won: GameState = {
      ...state,
      phase: "won",
      score: POINT_TARGET,
      collected: winningFourColorCollected(),
    };

    expect(
      applyGameMove(won, {
        axis: "row",
        index: 0,
        direction: "left",
      }).valid,
    ).toBe(false);
  });

  it("counts invalid preparation and invalid second moves", () => {
    const board = createEmptyBoard();
    board[0][0] = "blue";
    board[0][4] = "blue";
    board[2][1] = "red";
    // May or may not be two-step; force phase
    const prepState = makeState({
      board,
      phase: "two-step-first",
      moves: 1,
    });
    const badPrep = applyGameMove(prepState, {
      axis: "row",
      index: 6,
      direction: "left",
    });
    expect(badPrep.valid).toBe(false);
    expect(badPrep.state.moves).toBe(2);
    expect(badPrep.message).toMatch(/נספר כניסיון/);

    const secondState = makeState({
      board,
      phase: "two-step-second",
      moves: 4,
      pendingFirstMove: { axis: "column", index: 1, direction: "up" },
    });
    const badSecond = applyGameMove(secondState, {
      axis: "row",
      index: 5,
      direction: "right",
    });
    expect(badSecond.valid).toBe(false);
    expect(badSecond.state.moves).toBe(5);
    expect(badSecond.state.phase).toBe("two-step-second");
  });
});
