import { describe, expect, it } from "vitest";
import { pushLine, boardsEqual } from "@/lib/game/push-line";
import type { Board } from "@/lib/game/types";

function rowBoard(row: Board[number]): Board {
  return [
    row,
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ];
}

describe("pushLine", () => {
  const sample: Board[number] = [
    "red",
    null,
    "blue",
    null,
    "green",
    null,
    null,
  ];

  it("pushes left preserving relative order", () => {
    const board = rowBoard(sample);
    const next = pushLine(board, {
      axis: "row",
      index: 0,
      direction: "left",
    });
    expect(next[0]).toEqual([
      "red",
      "blue",
      "green",
      null,
      null,
      null,
      null,
    ]);
  });

  it("pushes right preserving relative order", () => {
    const board = rowBoard(sample);
    const next = pushLine(board, {
      axis: "row",
      index: 0,
      direction: "right",
    });
    expect(next[0]).toEqual([
      null,
      null,
      null,
      null,
      "red",
      "blue",
      "green",
    ]);
  });

  it("pushes column up", () => {
    const board: Board = [
      ["red", null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ["blue", null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ["green", null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ];
    const next = pushLine(board, {
      axis: "column",
      index: 0,
      direction: "up",
    });
    expect(next.map((row) => row[0])).toEqual([
      "red",
      "blue",
      "green",
      null,
      null,
      null,
      null,
    ]);
  });

  it("pushes column down", () => {
    const board: Board = [
      ["red", null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ["blue", null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ["green", null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ];
    const next = pushLine(board, {
      axis: "column",
      index: 0,
      direction: "down",
    });
    expect(next.map((row) => row[0])).toEqual([
      null,
      null,
      null,
      null,
      "red",
      "blue",
      "green",
    ]);
  });

  it("handles multiple empty cells", () => {
    const board = rowBoard([
      null,
      "red",
      null,
      null,
      "blue",
      null,
      "green",
    ]);
    const next = pushLine(board, {
      axis: "row",
      index: 0,
      direction: "left",
    });
    expect(next[0]).toEqual([
      "red",
      "blue",
      "green",
      null,
      null,
      null,
      null,
    ]);
  });

  it("detects no-op moves", () => {
    const board = rowBoard([
      "red",
      "blue",
      "green",
      null,
      null,
      null,
      null,
    ]);
    const next = pushLine(board, {
      axis: "row",
      index: 0,
      direction: "left",
    });
    expect(boardsEqual(board, next)).toBe(true);
  });

  it("does not mutate the original board", () => {
    const board = rowBoard(sample);
    const snapshot = board.map((row) => [...row]);
    pushLine(board, { axis: "row", index: 0, direction: "left" });
    expect(board).toEqual(snapshot);
  });
});
