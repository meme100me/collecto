import type {
  ApplyMoveResult,
  GameState,
  Move,
  PublicGameState,
} from "./types";
import {
  emptyCollected,
  GAME_STATE_VERSION,
  POINT_TARGET,
} from "./constants";
import { generateBoard } from "./board-generator";
import { collectGroups } from "./groups";
import {
  getLegalMoves,
  isLegalMove,
  isValidMoveShape,
  movesEqual,
} from "./legal-moves";
import { boardsEqual, pushLine } from "./push-line";
import { createGameSeed } from "./random";
import { calculateScore, mergeCollected } from "./scoring";
import {
  getSecondMovesAfterPreparation,
  getTwoStepOptions,
  getValidPreparationMoves,
  hasAnySolution,
  isValidPreparationMove,
} from "./two-step";

function createEmptyCollectedResult() {
  return emptyCollected();
}

function resolvePhaseAfterBoard(board: GameState["board"], score: number): {
  phase: GameState["phase"];
  hints?: Move[];
} {
  if (score >= POINT_TARGET) {
    return { phase: "won" };
  }

  const legal = getLegalMoves(board);
  if (legal.length > 0) {
    return { phase: "normal" };
  }

  const twoStep = getTwoStepOptions(board);
  if (twoStep.length > 0) {
    return {
      phase: "two-step-first",
      hints: twoStep.map((option) => option.first),
    };
  }

  return { phase: "lost" };
}

export function createInitialGameState(seed?: string): GameState {
  const resolvedSeed = seed ?? createGameSeed();
  const board = generateBoard(resolvedSeed);
  const collected = emptyCollected();
  const score = 0;
  const phaseInfo = resolvePhaseAfterBoard(board, score);

  return {
    version: GAME_STATE_VERSION,
    gameId: crypto.randomUUID(),
    seed: resolvedSeed,
    board,
    collected,
    score,
    moves: 0,
    phase: phaseInfo.phase === "two-step-first" ? "two-step-first" : "normal",
    createdAt: Date.now(),
  };
}

function flattenGroupCells(
  groups: { cells: { row: number; column: number }[] }[],
) {
  return groups.flatMap((group) => group.cells);
}

function invalidResult(
  state: GameState,
  message: string,
  hints?: Move[],
): ApplyMoveResult {
  return {
    state,
    valid: false,
    message,
    collectedThisMove: createEmptyCollectedResult(),
    collectedCells: [],
    scoreGained: 0,
    legalMoveHints: hints,
  };
}

export function applyGameMove(
  state: GameState,
  move: Move,
): ApplyMoveResult {
  if (state.phase === "won" || state.phase === "lost") {
    return invalidResult(state, "המשחק כבר הסתיים.");
  }

  if (!isValidMoveShape(move)) {
    return invalidResult(state, "מהלך לא חוקי.");
  }

  if (state.phase === "two-step-first") {
    return applyPreparationMove(state, move);
  }

  if (state.phase === "two-step-second") {
    return applySecondMove(state, move);
  }

  return applyNormalMove(state, move);
}

function applyNormalMove(state: GameState, move: Move): ApplyMoveResult {
  const pushed = pushLine(state.board, move);
  if (boardsEqual(state.board, pushed)) {
    return invalidResult(
      state,
      "המהלך לא משנה את מצב הלוח.",
    );
  }

  if (!isLegalMove(state.board, move)) {
    const hints =
      state.phase === "normal"
        ? undefined
        : getValidPreparationMoves(state.board);
    return invalidResult(
      state,
      "המהלך לא יוצר קבוצה של כדורים זהים.",
      hints,
    );
  }

  const collection = collectGroups(pushed);
  const collected = mergeCollected(state.collected, collection.collectedThisMove);
  const score = calculateScore(collected);
  const scoreGained = score - state.score;
  const nextBoard = collection.board;

  let nextState: GameState = {
    ...state,
    board: nextBoard,
    collected,
    score,
    moves: state.moves + 1,
    pendingFirstMove: undefined,
  };

  const collectedCells = flattenGroupCells(collection.groups);

  if (score >= POINT_TARGET) {
    nextState = { ...nextState, phase: "won" };
    return {
      state: nextState,
      valid: true,
      message: `כל הכבוד! הגעת ל-${POINT_TARGET} נקודות.`,
      collectedThisMove: collection.collectedThisMove,
      collectedCells,
      scoreGained,
    };
  }

  const phaseInfo = resolvePhaseAfterBoard(nextBoard, score);
  nextState = {
    ...nextState,
    phase: phaseInfo.phase,
  };

  const message = buildCollectionMessage(
    collection.collectedThisMove,
    scoreGained,
    score,
    phaseInfo.phase,
  );

  return {
    state: nextState,
    valid: true,
    message,
    collectedThisMove: collection.collectedThisMove,
    collectedCells,
    scoreGained,
    legalMoveHints: phaseInfo.hints,
  };
}

function applyPreparationMove(
  state: GameState,
  move: Move,
): ApplyMoveResult {
  if (!isValidPreparationMove(state.board, move)) {
    return invalidResult(
      state,
      "מהלך ההכנה אינו מוביל למהלך חוקי.",
      getValidPreparationMoves(state.board),
    );
  }

  const pushed = pushLine(state.board, move);
  const secondMoves = getSecondMovesAfterPreparation(state.board, move);

  const nextState: GameState = {
    ...state,
    board: pushed,
    moves: state.moves + 1,
    phase: "two-step-second",
    pendingFirstMove: move,
  };

  return {
    state: nextState,
    valid: true,
    message: "מהלך הכנה בוצע. כעת יש ליצור קבוצה.",
    collectedThisMove: createEmptyCollectedResult(),
    collectedCells: [],
    scoreGained: 0,
    legalMoveHints: secondMoves,
  };
}

function applySecondMove(state: GameState, move: Move): ApplyMoveResult {
  // After preparation the board is already pushed; second move must be a normal legal move.
  const legalSeconds = getLegalMoves(state.board);
  const isAllowed = legalSeconds.some((legal) => movesEqual(legal, move));

  if (!isAllowed) {
    return invalidResult(
      state,
      "המהלך השני חייב ליצור קבוצה של כדורים זהים.",
      legalSeconds,
    );
  }

  const pushed = pushLine(state.board, move);
  const collection = collectGroups(pushed);
  const collected = mergeCollected(state.collected, collection.collectedThisMove);
  const score = calculateScore(collected);
  const scoreGained = score - state.score;

  const collectedCells = flattenGroupCells(collection.groups);

  let nextState: GameState = {
    ...state,
    board: collection.board,
    collected,
    score,
    moves: state.moves + 1,
    pendingFirstMove: undefined,
  };

  if (score >= POINT_TARGET) {
    nextState = { ...nextState, phase: "won" };
    return {
      state: nextState,
      valid: true,
      message: `כל הכבוד! הגעת ל-${POINT_TARGET} נקודות.`,
      collectedThisMove: collection.collectedThisMove,
      collectedCells,
      scoreGained,
    };
  }

  const phaseInfo = resolvePhaseAfterBoard(collection.board, score);
  nextState = { ...nextState, phase: phaseInfo.phase };

  return {
    state: nextState,
    valid: true,
    message: buildCollectionMessage(
      collection.collectedThisMove,
      scoreGained,
      score,
      phaseInfo.phase,
    ),
    collectedThisMove: collection.collectedThisMove,
    collectedCells,
    scoreGained,
    legalMoveHints: phaseInfo.hints,
  };
}

function buildCollectionMessage(
  collectedThisMove: Record<string, number>,
  scoreGained: number,
  score: number,
  phase: GameState["phase"],
): string {
  const totalCollected = Object.values(collectedThisMove).reduce(
    (sum, n) => sum + n,
    0,
  );

  let message = `נאספו ${totalCollected} כדורים.`;
  if (scoreGained > 0) {
    message +=
      scoreGained === 1
        ? " קיבלת נקודה."
        : ` קיבלת ${scoreGained} נקודות.`;
  }
  message += ` הניקוד כעת ${score} מתוך ${POINT_TARGET}.`;

  if (phase === "two-step-first") {
    message += " אין מהלך רגיל — עברו למצב שני מהלכים.";
  } else if (phase === "lost") {
    message += " לא נותרו מהלכים אפשריים.";
  }

  return message;
}

export function toPublicGameState(
  state: GameState,
  options?: {
    message?: string;
    legalMoveHints?: Move[];
  },
): PublicGameState {
  let hints = options?.legalMoveHints;

  if (!hints) {
    if (state.phase === "two-step-first") {
      hints = getValidPreparationMoves(state.board);
    } else if (state.phase === "two-step-second") {
      hints = getLegalMoves(state.board);
    }
  }

  return {
    gameId: state.gameId,
    board: state.board.map((row) => [...row]),
    collected: { ...state.collected },
    score: state.score,
    moves: state.moves,
    phase: state.phase,
    targetScore: POINT_TARGET,
    legalMoveHints: hints,
    message: options?.message,
  };
}

export function boardStillPlayable(board: GameState["board"]): boolean {
  return hasAnySolution(board);
}
