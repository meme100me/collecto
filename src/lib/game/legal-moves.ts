import type { Board, Move } from "./types";
import { BOARD_SIZE } from "./constants";
import { boardsEqual, pushLine } from "./push-line";
import { findCollectableGroups } from "./groups";

export function allBasicMoves(): Move[] {
  const moves: Move[] = [];

  for (let index = 0; index < BOARD_SIZE; index += 1) {
    moves.push({ axis: "row", index, direction: "left" });
    moves.push({ axis: "row", index, direction: "right" });
    moves.push({ axis: "column", index, direction: "up" });
    moves.push({ axis: "column", index, direction: "down" });
  }

  return moves;
}

export function isValidMoveShape(move: Move): boolean {
  if (
    !Number.isInteger(move.index) ||
    move.index < 0 ||
    move.index >= BOARD_SIZE
  ) {
    return false;
  }

  if (move.axis === "row") {
    return move.direction === "left" || move.direction === "right";
  }

  if (move.axis === "column") {
    return move.direction === "up" || move.direction === "down";
  }

  return false;
}

export function getLegalMoves(board: Board): Move[] {
  return allBasicMoves().filter((move) => {
    const pushed = pushLine(board, move);
    if (boardsEqual(board, pushed)) {
      return false;
    }
    return findCollectableGroups(pushed).length > 0;
  });
}

export function isLegalMove(board: Board, move: Move): boolean {
  if (!isValidMoveShape(move)) {
    return false;
  }
  return getLegalMoves(board).some((legal) => movesEqual(legal, move));
}

export function movesEqual(a: Move, b: Move): boolean {
  return (
    a.axis === b.axis && a.index === b.index && a.direction === b.direction
  );
}
