import type { Board, Cell, Move } from "./types";
import { BOARD_SIZE } from "./constants";

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (a[r][c] !== b[r][c]) {
        return false;
      }
    }
  }
  return true;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null as Cell),
  );
}

function compressLine(cells: Cell[], toStart: boolean): Cell[] {
  const balls = cells.filter((cell): cell is NonNullable<Cell> => cell !== null);
  const empties = Array.from(
    { length: cells.length - balls.length },
    () => null as Cell,
  );
  return toStart ? [...balls, ...empties] : [...empties, ...balls];
}

export function pushLine(board: Board, move: Move): Board {
  const next = cloneBoard(board);

  if (move.axis === "row") {
    const row = next[move.index];
    const toStart = move.direction === "left";
    next[move.index] = compressLine(row, toStart);
    return next;
  }

  const columnCells: Cell[] = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    columnCells.push(next[r][move.index]);
  }
  const compressed = compressLine(columnCells, move.direction === "up");
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    next[r][move.index] = compressed[r];
  }
  return next;
}
