import { describe, expect, it } from "vitest";
import { getLegalMoves } from "@/lib/game/legal-moves";
import { createEmptyBoard, pushLine } from "@/lib/game/push-line";
import type { Board } from "@/lib/game/types";

describe("getLegalMoves", () => {
  it("returns moves that create a group of 2+", () => {
    const board = createEmptyBoard();
    board[0][0] = "blue";
    board[0][2] = "blue";
    board[0][4] = "red";

    const legal = getLegalMoves(board);
    expect(
      legal.some(
        (move) =>
          move.axis === "row" &&
          move.index === 0 &&
          move.direction === "left",
      ),
    ).toBe(true);
  });

  it("rejects no-op pushes", () => {
    const board = createEmptyBoard();
    board[0][0] = "red";
    board[0][1] = "blue";
    const pushed = pushLine(board, {
      axis: "row",
      index: 0,
      direction: "left",
    });
    expect(pushed[0][0]).toBe("red");
    expect(
      getLegalMoves(board).some(
        (m) =>
          m.axis === "row" && m.index === 0 && m.direction === "left",
      ),
    ).toBe(false);
  });

  it("rejects moves that change the board but create no group", () => {
    const board: Board = createEmptyBoard();
    board[0][1] = "red";
    board[0][3] = "blue";
    const legal = getLegalMoves(board);
    expect(
      legal.some(
        (m) =>
          m.axis === "row" && m.index === 0 && m.direction === "left",
      ),
    ).toBe(false);
  });
});
