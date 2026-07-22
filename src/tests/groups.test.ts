import { describe, expect, it } from "vitest";
import {
  findCollectableGroups,
  removeGroups,
} from "@/lib/game/groups";
import type { Board } from "@/lib/game/types";
import { createEmptyBoard } from "@/lib/game/push-line";

function set(
  board: Board,
  cells: Array<[number, number, NonNullable<Board[number][number]>]>,
): Board {
  const next = createEmptyBoard();
  for (const [r, c, color] of cells) {
    next[r][c] = color;
  }
  return next;
}

describe("findCollectableGroups", () => {
  it("finds a horizontal pair", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "blue"],
      [0, 1, "blue"],
    ]);
    const groups = findCollectableGroups(board);
    expect(groups).toHaveLength(1);
    expect(groups[0].color).toBe("blue");
    expect(groups[0].cells).toHaveLength(2);
  });

  it("finds a vertical pair", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "red"],
      [1, 0, "red"],
    ]);
    const groups = findCollectableGroups(board);
    expect(groups).toHaveLength(1);
    expect(groups[0].cells).toHaveLength(2);
  });

  it("does not collect diagonal-only adjacency", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "green"],
      [1, 1, "green"],
    ]);
    expect(findCollectableGroups(board)).toHaveLength(0);
  });

  it("collects an L shape of size 3", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "blue"],
      [0, 1, "blue"],
      [1, 0, "blue"],
    ]);
    const groups = findCollectableGroups(board);
    expect(groups).toHaveLength(1);
    expect(groups[0].cells).toHaveLength(3);
  });

  it("finds a larger connected group", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "yellow"],
      [0, 1, "yellow"],
      [0, 2, "yellow"],
      [1, 2, "yellow"],
    ]);
    const groups = findCollectableGroups(board);
    expect(groups).toHaveLength(1);
    expect(groups[0].cells).toHaveLength(4);
  });

  it("finds two separate groups in one pass", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "red"],
      [0, 1, "red"],
      [3, 3, "blue"],
      [3, 4, "blue"],
    ]);
    const groups = findCollectableGroups(board);
    expect(groups).toHaveLength(2);
  });

  it("keeps different colors separate", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "red"],
      [0, 1, "blue"],
      [0, 2, "blue"],
    ]);
    const groups = findCollectableGroups(board);
    expect(groups).toHaveLength(1);
    expect(groups[0].color).toBe("blue");
  });

  it("does not collect a single cell", () => {
    const board = set(createEmptyBoard(), [[2, 2, "orange"]]);
    expect(findCollectableGroups(board)).toHaveLength(0);
  });

  it("removes all groups at once", () => {
    const board = set(createEmptyBoard(), [
      [0, 0, "red"],
      [0, 1, "red"],
      [5, 5, "green"],
      [5, 6, "green"],
    ]);
    const groups = findCollectableGroups(board);
    const { board: next, collected } = removeGroups(board, groups);
    expect(next[0][0]).toBeNull();
    expect(next[0][1]).toBeNull();
    expect(next[5][5]).toBeNull();
    expect(next[5][6]).toBeNull();
    expect(collected.red).toBe(2);
    expect(collected.green).toBe(2);
  });
});
