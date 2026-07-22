import type { BallColor, Board } from "./types";
import {
  BALLS_PER_COLOR,
  BALL_COLORS,
  BOARD_SIZE,
  CENTER_INDEX,
  MAX_BOARD_GENERATION_ATTEMPTS,
} from "./constants";
import { SeededRandom } from "./random";
import { createEmptyBoard } from "./push-line";
import { hasAnySolution } from "./two-step";

function hasAdjacentSameColor(board: Board, row: number, col: number, color: BallColor): boolean {
  if (row > 0 && board[row - 1][col] === color) return true;
  if (row < BOARD_SIZE - 1 && board[row + 1][col] === color) return true;
  if (col > 0 && board[row][col - 1] === color) return true;
  if (col < BOARD_SIZE - 1 && board[row][col + 1] === color) return true;
  return false;
}

function boardHasAdjacentDuplicates(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const color = board[row][col];
      if (color === null) continue;
      if (col < BOARD_SIZE - 1 && board[row][col + 1] === color) return true;
      if (row < BOARD_SIZE - 1 && board[row + 1][col] === color) return true;
    }
  }
  return false;
}

function buildBallPool(rng: SeededRandom): BallColor[] {
  const pool: BallColor[] = [];
  for (const color of BALL_COLORS) {
    for (let i = 0; i < BALLS_PER_COLOR; i += 1) {
      pool.push(color);
    }
  }
  return rng.shuffle(pool);
}

function getOpenPositions(): Array<{ row: number; column: number }> {
  const positions: Array<{ row: number; column: number }> = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (row === CENTER_INDEX && column === CENTER_INDEX) continue;
      positions.push({ row, column });
    }
  }
  return positions;
}

function tryRandomPlacement(rng: SeededRandom): Board | null {
  const board = createEmptyBoard();
  const positions = rng.shuffle(getOpenPositions());
  const balls = buildBallPool(rng);

  for (let i = 0; i < balls.length; i += 1) {
    const { row, column } = positions[i];
    const color = balls[i];
    if (hasAdjacentSameColor(board, row, column, color)) {
      return null;
    }
    board[row][column] = color;
  }

  if (boardHasAdjacentDuplicates(board)) {
    return null;
  }

  if (!hasAnySolution(board)) {
    return null;
  }

  return board;
}

function backtrackingGenerate(rng: SeededRandom): Board | null {
  const board = createEmptyBoard();
  const positions = rng.shuffle(getOpenPositions());
  const remaining = new Map<BallColor, number>();
  for (const color of BALL_COLORS) {
    remaining.set(color, BALLS_PER_COLOR);
  }

  function place(index: number): boolean {
    if (index >= positions.length) {
      return hasAnySolution(board) && !boardHasAdjacentDuplicates(board);
    }

    const { row, column } = positions[index];
    const colors = rng.shuffle([...BALL_COLORS]);

    for (const color of colors) {
      const left = remaining.get(color) ?? 0;
      if (left <= 0) continue;
      if (hasAdjacentSameColor(board, row, column, color)) continue;

      board[row][column] = color;
      remaining.set(color, left - 1);

      if (place(index + 1)) {
        return true;
      }

      board[row][column] = null;
      remaining.set(color, left);
    }

    return false;
  }

  return place(0) ? board : null;
}

export function generateBoard(seed: string): Board {
  const rng = new SeededRandom(seed);

  for (let attempt = 0; attempt < MAX_BOARD_GENERATION_ATTEMPTS; attempt += 1) {
    const board = tryRandomPlacement(rng);
    if (board) {
      return board;
    }
  }

  const fallback = backtrackingGenerate(rng);
  if (fallback) {
    return fallback;
  }

  throw new Error("Failed to generate a valid Collecto board");
}

export function countBalls(board: Board): {
  total: number;
  byColor: Record<BallColor, number>;
  emptyCells: number;
} {
  const byColor: Record<BallColor, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    purple: 0,
    orange: 0,
  };
  let total = 0;
  let emptyCells = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = board[row][col];
      if (cell === null) {
        emptyCells += 1;
      } else {
        total += 1;
        byColor[cell] += 1;
      }
    }
  }

  return { total, byColor, emptyCells };
}

export function isValidStartingBoard(board: Board): boolean {
  if (board.length !== BOARD_SIZE) return false;
  if (board.some((row) => row.length !== BOARD_SIZE)) return false;
  if (board[CENTER_INDEX][CENTER_INDEX] !== null) return false;

  const { total, byColor, emptyCells } = countBalls(board);
  if (total !== BALLS_PER_COLOR * BALL_COLORS.length) return false;
  if (emptyCells !== 1) return false;
  if (BALL_COLORS.some((color) => byColor[color] !== BALLS_PER_COLOR)) {
    return false;
  }
  if (boardHasAdjacentDuplicates(board)) return false;
  return hasAnySolution(board);
}
