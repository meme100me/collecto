import type { BallColor, Board, CellCoord, CollectionResult, Group } from "./types";
import { BOARD_SIZE, emptyCollected } from "./constants";
import { cloneBoard } from "./push-line";

const DIRECTIONS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
] as const;

export function findCollectableGroups(board: Board): Group[] {
  const visited: boolean[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => false),
  );
  const groups: Group[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (visited[row][column] || board[row][column] === null) {
        continue;
      }

      const color = board[row][column] as BallColor;
      const cells: CellCoord[] = [];
      const queue: CellCoord[] = [{ row, column }];
      visited[row][column] = true;

      while (queue.length > 0) {
        const current = queue.shift()!;
        cells.push(current);

        for (const { dr, dc } of DIRECTIONS) {
          const nr = current.row + dr;
          const nc = current.column + dc;
          if (
            nr < 0 ||
            nr >= BOARD_SIZE ||
            nc < 0 ||
            nc >= BOARD_SIZE ||
            visited[nr][nc] ||
            board[nr][nc] !== color
          ) {
            continue;
          }
          visited[nr][nc] = true;
          queue.push({ row: nr, column: nc });
        }
      }

      if (cells.length >= 2) {
        groups.push({ color, cells });
      }
    }
  }

  return groups;
}

export function removeGroups(
  board: Board,
  groups: Group[],
): {
  board: Board;
  collected: Record<BallColor, number>;
} {
  const next = cloneBoard(board);
  const collected = emptyCollected();

  for (const group of groups) {
    collected[group.color] += group.cells.length;
    for (const { row, column } of group.cells) {
      next[row][column] = null;
    }
  }

  return { board: next, collected };
}

export function collectGroups(board: Board): CollectionResult {
  const groups = findCollectableGroups(board);
  const { board: nextBoard, collected } = removeGroups(board, groups);
  return {
    board: nextBoard,
    collectedThisMove: collected,
    groups,
  };
}
