import { describe, expect, it } from "vitest";
import {
  countBalls,
  generateBoard,
  isValidStartingBoard,
} from "@/lib/game/board-generator";
import {
  BALLS_PER_COLOR,
  BALL_COLORS,
  BOARD_SIZE,
  CENTER_INDEX,
  MOVE_LIMIT,
  TOTAL_BALLS,
} from "@/lib/game/constants";
import { getLegalMoves } from "@/lib/game/legal-moves";
import { isBoardSolvableWithinLimit } from "@/lib/game/solvability";

describe("generateBoard", () => {
  it("creates a 7x7 board with empty center and 48 balls", () => {
    const board = generateBoard("seed-board-1");
    expect(board).toHaveLength(BOARD_SIZE);
    expect(board.every((row) => row.length === BOARD_SIZE)).toBe(true);
    expect(board[CENTER_INDEX][CENTER_INDEX]).toBeNull();

    const counts = countBalls(board);
    expect(counts.total).toBe(TOTAL_BALLS);
    expect(counts.emptyCells).toBe(1);
    for (const color of BALL_COLORS) {
      expect(counts.byColor[color]).toBe(BALLS_PER_COLOR);
    }
  });

  it("has no identical adjacent balls horizontally or vertically", () => {
    const board = generateBoard("seed-board-2");
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const color = board[r][c];
        if (!color) continue;
        if (c < BOARD_SIZE - 1) {
          expect(board[r][c + 1]).not.toBe(color);
        }
        if (r < BOARD_SIZE - 1) {
          expect(board[r + 1][c]).not.toBe(color);
        }
      }
    }
  });

  it("is deterministic for the same seed", () => {
    const a = generateBoard("same-seed");
    const b = generateBoard("same-seed");
    expect(a).toEqual(b);
  });

  it("can produce different boards for different seeds", () => {
    const a = generateBoard("seed-A");
    const b = generateBoard("seed-B");
    expect(a).not.toEqual(b);
  });

  it("always has at least one legal move or two-step solution", () => {
    const board = generateBoard("seed-playable");
    expect(isValidStartingBoard(board)).toBe(true);
    expect(getLegalMoves(board).length + 1).toBeGreaterThan(0);
  });

  it("returns boards solvable under the new win rules within the move limit", () => {
    const seeds = [
      "seed-board-1",
      "seed-playable",
      "engine-seed-1",
      "solvability-a",
      "solvability-b",
      "solvability-c",
    ];

    for (const seed of seeds) {
      const board = generateBoard(seed);
      expect(isBoardSolvableWithinLimit(board, MOVE_LIMIT)).toBe(true);
      expect(isValidStartingBoard(board)).toBe(true);
    }
  });
});
