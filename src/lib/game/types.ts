export type BallColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange";

export type Cell = BallColor | null;

export type Board = Cell[][];

export type Move =
  | {
      axis: "row";
      index: number;
      direction: "left" | "right";
    }
  | {
      axis: "column";
      index: number;
      direction: "up" | "down";
    };

export type GamePhase =
  | "normal"
  | "two-step-first"
  | "two-step-second"
  | "won"
  | "lost";

export interface CellCoord {
  row: number;
  column: number;
}

export interface Group {
  color: BallColor;
  cells: CellCoord[];
}

export interface CollectionResult {
  board: Board;
  collectedThisMove: Record<BallColor, number>;
  groups: Group[];
}

export interface GameState {
  version: number;
  gameId: string;
  seed: string;
  board: Board;
  collected: Record<BallColor, number>;
  score: number;
  moves: number;
  phase: GamePhase;
  pendingFirstMove?: Move;
  createdAt: number;
}

export interface PublicGameState {
  gameId: string;
  board: Board;
  collected: Record<BallColor, number>;
  score: number;
  moves: number;
  phase: GamePhase;
  targetScore: number;
  moveLimit: number;
  movesRemaining: number;
  scoringColorCount: number;
  requiredScoringColors: number;
  legalMoveHints?: Move[];
  message?: string;
}

export interface TwoStepOption {
  first: Move;
  secondMoves: Move[];
}

export interface ApplyMoveResult {
  state: GameState;
  valid: boolean;
  message: string;
  collectedThisMove: Record<BallColor, number>;
  collectedCells: CellCoord[];
  scoreGained: number;
  legalMoveHints?: Move[];
}

export interface StartGameResponse {
  stateToken: string;
  game: PublicGameState;
}

export interface MoveRequest {
  stateToken: string;
  move: Move;
}

export interface MoveResponse {
  stateToken: string;
  game: PublicGameState;
  result: {
    valid: boolean;
    message: string;
    collectedThisMove: Record<BallColor, number>;
    collectedCells: CellCoord[];
    scoreGained: number;
  };
}

export interface WinningMoveResponse extends MoveResponse {
  game: PublicGameState & {
    phase: "won";
  };
  coordinates: string;
}
