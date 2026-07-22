import type {
  ApplyMoveResult,
  GameState,
  Move,
  PublicGameState,
} from "./types";
import {
  emptyCollected,
  GAME_STATE_VERSION,
  MIN_SCORING_COLORS,
  MOVE_LIMIT,
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
import {
  calculateScore,
  countScoringColors,
  meetsWinConditions,
  mergeCollected,
} from "./scoring";
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

function resolvePhaseAfterBoard(
  board: GameState["board"],
  collected: GameState["collected"],
  moves: number,
): {
  phase: GameState["phase"];
  hints?: Move[];
} {
  if (meetsWinConditions(collected)) {
    return { phase: "won" };
  }

  if (moves >= MOVE_LIMIT) {
    return { phase: "lost" };
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

function remainingAttemptsLabel(remaining: number): string {
  if (remaining === 1) {
    return "נותר ניסיון אחד";
  }
  return `נותרו ${remaining} ניסיונות`;
}

function buildCountedInvalidMessage(
  reason: string,
  moves: number,
): string {
  if (moves >= MOVE_LIMIT) {
    return `${reason} זה היה הניסיון האחרון. נגמרו ${MOVE_LIMIT} הניסיונות.`;
  }
  const remaining = MOVE_LIMIT - moves;
  return `${reason} והוא נספר כניסיון. ${remainingAttemptsLabel(remaining)}.`;
}

function buildWinMessage(): string {
  return `כל הכבוד! הגעת ל-${POINT_TARGET} נקודות בלפחות ${MIN_SCORING_COLORS} צבעים.`;
}

function buildPostMoveLossMessage(
  collected: GameState["collected"],
  score: number,
): string {
  if (
    score >= POINT_TARGET &&
    countScoringColors(collected) < MIN_SCORING_COLORS
  ) {
    return `הגעת ל-${POINT_TARGET} נקודות, אך דרישת ${MIN_SCORING_COLORS} הצבעים עדיין לא הושלמה. נגמרו ${MOVE_LIMIT} הניסיונות.`;
  }
  if (score >= POINT_TARGET) {
    return `נגמרו ${MOVE_LIMIT} הניסיונות לפני השלמת תנאי הניצחון.`;
  }
  return `נגמרו ${MOVE_LIMIT} הניסיונות. הניקוד שהושג: ${score} מתוך ${POINT_TARGET}.`;
}

export function createInitialGameState(seed?: string): GameState {
  const resolvedSeed = seed ?? createGameSeed();
  const board = generateBoard(resolvedSeed);
  const collected = emptyCollected();
  const score = 0;
  const phaseInfo = resolvePhaseAfterBoard(board, collected, 0);

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

function invalidResultUncounted(
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

function countedInvalidResult(
  state: GameState,
  reason: string,
  hints?: Move[],
): ApplyMoveResult {
  const moves = state.moves + 1;
  let nextState: GameState = {
    ...state,
    moves,
  };

  if (moves >= MOVE_LIMIT) {
    nextState = { ...nextState, phase: "lost", pendingFirstMove: undefined };
  }

  return {
    state: nextState,
    valid: false,
    message: buildCountedInvalidMessage(reason, moves),
    collectedThisMove: createEmptyCollectedResult(),
    collectedCells: [],
    scoreGained: 0,
    legalMoveHints:
      nextState.phase === "lost" ? undefined : hints,
  };
}

export function applyGameMove(
  state: GameState,
  move: Move,
): ApplyMoveResult {
  if (state.phase === "won" || state.phase === "lost") {
    return invalidResultUncounted(state, "המשחק כבר הסתיים.");
  }

  if (!isValidMoveShape(move)) {
    return invalidResultUncounted(state, "מהלך לא חוקי.");
  }

  if (state.phase === "two-step-first") {
    return applyPreparationMove(state, move);
  }

  if (state.phase === "two-step-second") {
    return applySecondMove(state, move);
  }

  return applyNormalMove(state, move);
}

function finalizeAfterScoringMove(
  state: GameState,
  nextBoard: GameState["board"],
  collected: GameState["collected"],
  score: number,
  collectedThisMove: ApplyMoveResult["collectedThisMove"],
  collectedCells: ApplyMoveResult["collectedCells"],
  scoreGained: number,
): ApplyMoveResult {
  const moves = state.moves + 1;
  let nextState: GameState = {
    ...state,
    board: nextBoard,
    collected,
    score,
    moves,
    pendingFirstMove: undefined,
  };

  if (meetsWinConditions(collected)) {
    nextState = { ...nextState, phase: "won" };
    return {
      state: nextState,
      valid: true,
      message: buildWinMessage(),
      collectedThisMove,
      collectedCells,
      scoreGained,
    };
  }

  const phaseInfo = resolvePhaseAfterBoard(nextBoard, collected, moves);
  nextState = {
    ...nextState,
    phase: phaseInfo.phase,
  };

  if (phaseInfo.phase === "lost" && moves >= MOVE_LIMIT) {
    return {
      state: nextState,
      valid: true,
      message: buildPostMoveLossMessage(collected, score),
      collectedThisMove,
      collectedCells,
      scoreGained,
    };
  }

  const message = buildCollectionMessage(
    collectedThisMove,
    scoreGained,
    score,
    collected,
    phaseInfo.phase,
    moves,
  );

  return {
    state: nextState,
    valid: true,
    message,
    collectedThisMove,
    collectedCells,
    scoreGained,
    legalMoveHints: phaseInfo.hints,
  };
}

function applyNormalMove(state: GameState, move: Move): ApplyMoveResult {
  const pushed = pushLine(state.board, move);
  if (boardsEqual(state.board, pushed)) {
    return countedInvalidResult(state, "המהלך לא משנה את מצב הלוח");
  }

  if (!isLegalMove(state.board, move)) {
    const hints =
      state.phase === "normal"
        ? undefined
        : getValidPreparationMoves(state.board);
    return countedInvalidResult(
      state,
      "המהלך אינו יוצר קבוצה",
      hints,
    );
  }

  const collection = collectGroups(pushed);
  const collected = mergeCollected(state.collected, collection.collectedThisMove);
  const score = calculateScore(collected);
  const scoreGained = score - state.score;

  return finalizeAfterScoringMove(
    state,
    collection.board,
    collected,
    score,
    collection.collectedThisMove,
    flattenGroupCells(collection.groups),
    scoreGained,
  );
}

function applyPreparationMove(
  state: GameState,
  move: Move,
): ApplyMoveResult {
  if (!isValidPreparationMove(state.board, move)) {
    return countedInvalidResult(
      state,
      "מהלך ההכנה אינו מוביל למהלך חוקי",
      getValidPreparationMoves(state.board),
    );
  }

  const pushed = pushLine(state.board, move);
  const moves = state.moves + 1;
  const secondMoves = getSecondMovesAfterPreparation(state.board, move);

  let nextState: GameState = {
    ...state,
    board: pushed,
    moves,
    phase: "two-step-second",
    pendingFirstMove: move,
  };

  if (moves >= MOVE_LIMIT) {
    nextState = { ...nextState, phase: "lost" };
    return {
      state: nextState,
      valid: true,
      message: buildPostMoveLossMessage(nextState.collected, nextState.score),
      collectedThisMove: createEmptyCollectedResult(),
      collectedCells: [],
      scoreGained: 0,
    };
  }

  return {
    state: nextState,
    valid: true,
    message: `מהלך הכנה בוצע. כעת יש ליצור קבוצה. ${remainingAttemptsLabel(MOVE_LIMIT - moves)}.`,
    collectedThisMove: createEmptyCollectedResult(),
    collectedCells: [],
    scoreGained: 0,
    legalMoveHints: secondMoves,
  };
}

function applySecondMove(state: GameState, move: Move): ApplyMoveResult {
  const legalSeconds = getLegalMoves(state.board);
  const isAllowed = legalSeconds.some((legal) => movesEqual(legal, move));

  if (!isAllowed) {
    return countedInvalidResult(
      state,
      "המהלך השני אינו יוצר קבוצה",
      legalSeconds,
    );
  }

  const pushed = pushLine(state.board, move);
  const collection = collectGroups(pushed);
  const collected = mergeCollected(state.collected, collection.collectedThisMove);
  const score = calculateScore(collected);
  const scoreGained = score - state.score;

  return finalizeAfterScoringMove(
    state,
    collection.board,
    collected,
    score,
    collection.collectedThisMove,
    flattenGroupCells(collection.groups),
    scoreGained,
  );
}

function buildCollectionMessage(
  collectedThisMove: Record<string, number>,
  scoreGained: number,
  score: number,
  collected: GameState["collected"],
  phase: GameState["phase"],
  moves: number,
): string {
  const totalCollected = Object.values(collectedThisMove).reduce(
    (sum, n) => sum + n,
    0,
  );
  const scoringColors = countScoringColors(collected);
  const remaining = Math.max(0, MOVE_LIMIT - moves);

  let message = `נאספו ${totalCollected} כדורים.`;
  if (scoreGained > 0) {
    message +=
      scoreGained === 1
        ? " קיבלת נקודה."
        : ` קיבלת ${scoreGained} נקודות.`;
  }
  message += ` הניקוד כעת ${score} מתוך ${POINT_TARGET}.`;
  message += ` צבעים מנוקדים: ${scoringColors} מתוך ${MIN_SCORING_COLORS}.`;
  message += ` ${remainingAttemptsLabel(remaining)}.`;

  if (phase === "two-step-first") {
    message += " אין מהלך רגיל — עברו למצב שני מהלכים.";
  } else if (phase === "lost") {
    if (score >= POINT_TARGET && scoringColors < MIN_SCORING_COLORS) {
      message += ` דרישת ${MIN_SCORING_COLORS} הצבעים עדיין לא הושלמה.`;
    } else {
      message += " לא נותרו מהלכים אפשריים.";
    }
  }

  return message;
}

export function shouldRevealCoordinates(state: GameState): boolean {
  return state.phase === "won" && meetsWinConditions(state.collected);
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
    moveLimit: MOVE_LIMIT,
    movesRemaining: Math.max(0, MOVE_LIMIT - state.moves),
    scoringColorCount: countScoringColors(state.collected),
    requiredScoringColors: MIN_SCORING_COLORS,
    legalMoveHints: hints,
    message: options?.message,
  };
}

export function boardStillPlayable(board: GameState["board"]): boolean {
  return hasAnySolution(board);
}
