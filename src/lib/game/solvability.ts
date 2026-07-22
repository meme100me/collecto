import type { BallColor, Board, Move } from "./types";
import {
  BALL_COLORS,
  emptyCollected,
  MAX_SOLVABILITY_NODES,
  MIN_SCORING_COLORS,
  MOVE_LIMIT,
  POINT_TARGET,
} from "./constants";
import { collectGroups } from "./groups";
import { getLegalMoves } from "./legal-moves";
import { pushLine } from "./push-line";
import {
  calculateScore,
  countScoringColors,
  meetsWinConditions,
  mergeCollected,
} from "./scoring";
import { getTwoStepOptions } from "./two-step";

function boardKey(board: Board): string {
  return board.map((row) => row.map((cell) => cell?.[0] ?? ".").join("")).join("|");
}

function collectedKey(collected: Record<BallColor, number>): string {
  return BALL_COLORS.map((color) => collected[color]).join(",");
}

function applyScoringMove(
  board: Board,
  move: Move,
  collected: Record<BallColor, number>,
): { board: Board; collected: Record<BallColor, number> } {
  const pushed = pushLine(board, move);
  const collection = collectGroups(pushed);
  return {
    board: collection.board,
    collected: mergeCollected(collected, collection.collectedThisMove),
  };
}

/**
 * Deterministic search for a legal win path within MOVE_LIMIT.
 * Accepts a board only when a concrete win path is found (no false positives).
 * Caps explored nodes so generation cannot hang.
 */
export function isBoardSolvableWithinLimit(
  board: Board,
  moveLimit: number = MOVE_LIMIT,
  maxNodes: number = MAX_SOLVABILITY_NODES,
): boolean {
  type Frame = {
    board: Board;
    collected: Record<BallColor, number>;
    moves: number;
  };

  let nodes = 0;
  const bestMoves = new Map<string, number>();

  function dfs(current: Frame): boolean {
    nodes += 1;
    if (nodes > maxNodes) {
      return false;
    }

    if (meetsWinConditions(current.collected)) {
      return true;
    }

    if (current.moves >= moveLimit) {
      return false;
    }

    const stateKey = `${boardKey(current.board)}#${collectedKey(current.collected)}`;
    const previousMoves = bestMoves.get(stateKey);
    if (previousMoves !== undefined && previousMoves <= current.moves) {
      return false;
    }
    bestMoves.set(stateKey, current.moves);

    const remaining = moveLimit - current.moves;
    const score = calculateScore(current.collected);
    const colors = countScoringColors(current.collected);
    const needPoints = Math.max(0, POINT_TARGET - score);
    const needColors = Math.max(0, MIN_SCORING_COLORS - colors);
    if (Math.max(needPoints, needColors) > remaining) {
      return false;
    }

    const candidates: Array<{
      cost: number;
      board: Board;
      collected: Record<BallColor, number>;
    }> = [];

    const legal = getLegalMoves(current.board);
    if (legal.length > 0) {
      for (const move of legal) {
        const next = applyScoringMove(current.board, move, current.collected);
        candidates.push({ cost: 1, board: next.board, collected: next.collected });
      }
    } else {
      for (const option of getTwoStepOptions(current.board)) {
        if (current.moves + 2 > moveLimit) {
          continue;
        }
        const afterPrep = pushLine(current.board, option.first);
        for (const second of option.secondMoves) {
          const next = applyScoringMove(afterPrep, second, current.collected);
          candidates.push({
            cost: 2,
            board: next.board,
            collected: next.collected,
          });
        }
      }
    }

    candidates.sort((a, b) => {
      const scoreA =
        calculateScore(a.collected) * 10 + countScoringColors(a.collected);
      const scoreB =
        calculateScore(b.collected) * 10 + countScoringColors(b.collected);
      return scoreB - scoreA;
    });

    for (const candidate of candidates) {
      if (
        dfs({
          board: candidate.board,
          collected: candidate.collected,
          moves: current.moves + candidate.cost,
        })
      ) {
        return true;
      }
      if (nodes > maxNodes) {
        return false;
      }
    }

    return false;
  }

  return dfs({ board, collected: emptyCollected(), moves: 0 });
}
