import type { Board, Move, TwoStepOption } from "./types";
import { allBasicMoves, getLegalMoves, movesEqual } from "./legal-moves";
import { boardsEqual, pushLine } from "./push-line";

export function getTwoStepOptions(board: Board): TwoStepOption[] {
  if (getLegalMoves(board).length > 0) {
    return [];
  }

  const options: TwoStepOption[] = [];

  for (const first of allBasicMoves()) {
    const afterFirst = pushLine(board, first);
    if (boardsEqual(board, afterFirst)) {
      continue;
    }

    const secondMoves = getLegalMoves(afterFirst);
    if (secondMoves.length > 0) {
      options.push({ first, secondMoves });
    }
  }

  return options;
}

export function getValidPreparationMoves(board: Board): Move[] {
  return getTwoStepOptions(board).map((option) => option.first);
}

export function getSecondMovesAfterPreparation(
  board: Board,
  first: Move,
): Move[] {
  const afterFirst = pushLine(board, first);
  return getLegalMoves(afterFirst);
}

export function isValidPreparationMove(board: Board, move: Move): boolean {
  return getValidPreparationMoves(board).some((prep) =>
    movesEqual(prep, move),
  );
}

export function hasAnySolution(board: Board): boolean {
  return (
    getLegalMoves(board).length > 0 || getTwoStepOptions(board).length > 0
  );
}
