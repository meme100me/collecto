import { describe, expect, it } from "vitest";
import { createEmptyBoard, pushLine } from "@/lib/game/push-line";
import { getLegalMoves, allBasicMoves } from "@/lib/game/legal-moves";
import {
  getTwoStepOptions,
  getValidPreparationMoves,
  hasAnySolution,
} from "@/lib/game/two-step";
import { applyGameMove } from "@/lib/game/game-engine";
import type { Board, GameState, Move } from "@/lib/game/types";
import { emptyCollected } from "@/lib/game/constants";
import { boardsEqual } from "@/lib/game/push-line";
import { findCollectableGroups } from "@/lib/game/groups";

function baseState(board: Board, phase: GameState["phase"]): GameState {
  return {
    version: 1,
    gameId: "test-game",
    seed: "test",
    board,
    collected: emptyCollected(),
    score: 0,
    moves: 0,
    phase,
    createdAt: Date.now(),
  };
}

/**
 * Find a compact board with no normal legal move but at least one two-step chain.
 */
function findTwoStepOnlyBoard(): Board {
  // Pattern:
  // blue at (0,0) and (0,4) separated by blockers so one push won't join them.
  // red at (1,1) used as a "bridge" piece that must be moved first.
  //
  // Concrete solution discovered by enumeration of a small fixture:
  // First push column 1 up (moves helper), then push row 0 to join blues.
  const candidates: Board[] = [];

  const board = createEmptyBoard();
  board[0][0] = "blue";
  board[0][2] = "green";
  board[0][4] = "blue";
  board[2][1] = "red";
  board[3][3] = "yellow";
  board[4][5] = "orange";
  board[5][6] = "purple";
  board[6][2] = "red";
  candidates.push(board);

  const board2 = createEmptyBoard();
  board2[0][1] = "blue";
  board2[1][3] = "blue";
  board2[0][4] = "red";
  board2[2][0] = "green";
  board2[3][2] = "yellow";
  board2[4][4] = "orange";
  board2[5][5] = "purple";
  board2[6][6] = "red";
  candidates.push(board2);

  // Brute force: place two blues and fillers, search for two-step-only
  for (let a = 0; a < 49; a += 1) {
    for (let b = a + 1; b < 49; b += 1) {
      const r1 = Math.floor(a / 7);
      const c1 = a % 7;
      const r2 = Math.floor(b / 7);
      const c2 = b % 7;
      if (r1 === 3 && c1 === 3) continue;
      if (r2 === 3 && c2 === 3) continue;

      const trial = createEmptyBoard();
      trial[r1][c1] = "blue";
      trial[r2][c2] = "blue";
      // Add distractors far away
      trial[6][0] = "red";
      trial[6][2] = "green";
      trial[6][4] = "yellow";
      trial[0][6] = "orange";
      trial[2][6] = "purple";

      if (getLegalMoves(trial).length > 0) continue;
      if (getTwoStepOptions(trial).length > 0) {
        return trial;
      }
    }
  }

  for (const candidate of candidates) {
    if (
      getLegalMoves(candidate).length === 0 &&
      getTwoStepOptions(candidate).length > 0
    ) {
      return candidate;
    }
  }

  throw new Error("Could not find two-step-only board fixture");
}

describe("two-step mode", () => {
  it("returns no two-step options when a normal legal move exists", () => {
    const board = createEmptyBoard();
    board[0][0] = "blue";
    board[0][2] = "blue";
    expect(getLegalMoves(board).length).toBeGreaterThan(0);
    expect(getTwoStepOptions(board)).toEqual([]);
  });

  it("identifies preparation moves only when they enable a second collect", () => {
    const board = findTwoStepOnlyBoard();
    expect(getLegalMoves(board)).toEqual([]);
    const options = getTwoStepOptions(board);
    expect(options.length).toBeGreaterThan(0);

    const preps = getValidPreparationMoves(board);
    expect(preps.length).toBe(options.length);

    // Every listed prep must change the board and unlock a legal second move
    for (const prep of preps) {
      const after = pushLine(board, prep);
      expect(boardsEqual(board, after)).toBe(false);
      expect(getLegalMoves(after).length).toBeGreaterThan(0);
    }

    // A random no-op / dead-end move should not be listed
    const deadEnds = allBasicMoves().filter((move) => {
      const after = pushLine(board, move);
      if (boardsEqual(board, after)) return true;
      return getLegalMoves(after).length === 0;
    });
    for (const dead of deadEnds) {
      expect(
        preps.some(
          (p) =>
            p.axis === dead.axis &&
            p.index === dead.index &&
            p.direction === dead.direction,
        ),
      ).toBe(false);
    }
  });

  it("first move does not collect balls; second move does", () => {
    const board = findTwoStepOnlyBoard();
    const prep = getValidPreparationMoves(board)[0];
    const state = baseState(board, "two-step-first");

    const first = applyGameMove(state, prep);
    expect(first.valid).toBe(true);
    expect(first.state.phase).toBe("two-step-second");
    expect(Object.values(first.collectedThisMove).every((n) => n === 0)).toBe(
      true,
    );
    expect(first.scoreGained).toBe(0);
    expect(first.message).toContain("מהלך הכנה");

    const secondMove = first.legalMoveHints![0] as Move;
    const second = applyGameMove(first.state, secondMove);
    expect(second.valid).toBe(true);
    expect(Object.values(second.collectedThisMove).some((n) => n >= 2)).toBe(
      true,
    );
    expect(findCollectableGroups(first.state.board).length).toBe(0);
  });

  it("detects a board with no one- or two-move solution", () => {
    const board = createEmptyBoard();
    board[0][0] = "red";
    board[0][3] = "blue";
    board[3][0] = "green";
    board[3][3] = null; // center stays empty
    board[6][6] = "yellow";
    board[6][0] = "orange";
    board[0][6] = "purple";

    expect(getLegalMoves(board)).toEqual([]);
    expect(getTwoStepOptions(board)).toEqual([]);
    expect(hasAnySolution(board)).toBe(false);
  });
});
