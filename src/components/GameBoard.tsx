"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BallColor, Board, Move, PublicGameState } from "@/lib/game/types";
import { COLOR_LABELS_HE } from "@/lib/game/constants";
import { Ball } from "./Ball";

interface GameBoardProps {
  game: PublicGameState;
  disabled?: boolean;
  shake?: boolean;
  onMove: (move: Move) => void;
  selectedCell: { row: number; column: number } | null;
  onSelectCell: (cell: { row: number; column: number } | null) => void;
  showFirstTip?: boolean;
  collectingCells?: Array<{ row: number; column: number }>;
  pushPreview?: Move | null;
}

const SWIPE_THRESHOLD = 28;

function cellLabel(board: Board, row: number, column: number): string {
  const cell = board[row][column];
  if (cell === null) {
    return `תא ריק בשורה ${row + 1}, עמודה ${column + 1}`;
  }
  return `כדור ${COLOR_LABELS_HE[cell]} בשורה ${row + 1}, עמודה ${column + 1}`;
}

function isHinted(
  hints: Move[] | undefined,
  axis: Move["axis"],
  index: number,
): boolean {
  if (!hints) return false;
  return hints.some((h) => h.axis === axis && h.index === index);
}

export function GameBoard({
  game,
  disabled = false,
  shake = false,
  onMove,
  selectedCell,
  onSelectCell,
  showFirstTip = false,
  collectingCells = [],
  pushPreview = null,
}: GameBoardProps) {
  const boardId = useId();
  const pointerStart = useRef<{
    x: number;
    y: number;
    row: number;
    column: number;
  } | null>(null);
  const [dragAxis, setDragAxis] = useState<"row" | "column" | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragDirection, setDragDirection] = useState<
    "left" | "right" | "up" | "down" | null
  >(null);

  const collectingKey = useMemo(
    () => new Set(collectingCells.map((c) => `${c.row}:${c.column}`)),
    [collectingCells],
  );

  const handlePointerDown = (
    event: React.PointerEvent,
    row: number,
    column: number,
  ) => {
    if (disabled || game.board[row][column] === null) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      row,
      column,
    };
    setDragAxis(null);
    setDragIndex(null);
    setDragDirection(null);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!pointerStart.current || disabled) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragAxis("row");
      setDragIndex(pointerStart.current.row);
      setDragDirection(deltaX > 0 ? "right" : "left");
    } else {
      setDragAxis("column");
      setDragIndex(pointerStart.current.column);
      setDragDirection(deltaY > 0 ? "down" : "up");
    }
  };

  const finishPointer = (event: React.PointerEvent) => {
    if (!pointerStart.current || disabled) {
      pointerStart.current = null;
      setDragAxis(null);
      setDragIndex(null);
      setDragDirection(null);
      return;
    }

    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    const { row, column } = pointerStart.current;
    pointerStart.current = null;
    setDragAxis(null);
    setDragIndex(null);
    setDragDirection(null);

    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD &&
      Math.abs(deltaY) < SWIPE_THRESHOLD
    ) {
      onSelectCell({ row, column });
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      onMove({
        axis: "row",
        index: row,
        direction: deltaX > 0 ? "right" : "left",
      });
    } else {
      onMove({
        axis: "column",
        index: column,
        direction: deltaY > 0 ? "down" : "up",
      });
    }
  };

  const onKeyDownCell = useCallback(
    (event: React.KeyboardEvent, row: number, column: number) => {
      if (disabled) return;

      const moveFocus = (nr: number, nc: number) => {
        const el = document.getElementById(`${boardId}-${nr}-${nc}`);
        el?.focus();
      };

      if (selectedCell && selectedCell.row === row && selectedCell.column === column) {
        if (event.key === "Escape") {
          event.preventDefault();
          onSelectCell(null);
          return;
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onMove({ axis: "row", index: row, direction: "left" });
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onMove({ axis: "row", index: row, direction: "right" });
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onMove({ axis: "column", index: column, direction: "up" });
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          onMove({ axis: "column", index: column, direction: "down" });
          return;
        }
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (game.board[row][column] !== null) {
          onSelectCell({ row, column });
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveFocus(row, Math.max(0, column - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveFocus(row, Math.min(6, column + 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(Math.max(0, row - 1), column);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(Math.min(6, row + 1), column);
      }
    },
    [boardId, disabled, game.board, onMove, onSelectCell, selectedCell],
  );

  const activeAxis = pushPreview?.axis ?? dragAxis;
  const activeIndex = pushPreview?.index ?? dragIndex;
  const activeDirection = pushPreview?.direction ?? dragDirection;

  return (
    <div className="relative">
      {showFirstTip && selectedCell && (
        <div className="mb-2 rounded-xl bg-[#fff6df] border border-[#f0d48a] px-3 py-2 text-sm text-[#6a4f12]">
          בחרו כיוון עם החצים למטה, או גררו את הכדור לכיוון הרצוי.
        </div>
      )}

      <div
        className={[
          "relative w-full max-w-[min(92vw,520px)] mx-auto aspect-square touch-none select-none rounded-2xl p-2 sm:p-3",
          "bg-gradient-to-br from-[#dbeaf3] via-[#c9dce8] to-[#b7cedd] shadow-inner border border-[#9fb8c9]",
          shake ? "animate-board-shake" : "",
        ].join(" ")}
        role="grid"
        aria-label="לוח המשחק"
        dir="ltr"
      >
        {activeDirection && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl text-[#1a4d6d]/35 font-black"
            aria-hidden="true"
          >
            {activeDirection === "left" && "←"}
            {activeDirection === "right" && "→"}
            {activeDirection === "up" && "↑"}
            {activeDirection === "down" && "↓"}
          </div>
        )}

        <div className="grid grid-cols-7 grid-rows-7 gap-1 sm:gap-1.5 h-full w-full">
          {game.board.map((rowCells, row) =>
            rowCells.map((cell, column) => {
              const selected =
                selectedCell?.row === row && selectedCell?.column === column;
              const rowHint = isHinted(game.legalMoveHints, "row", row);
              const colHint = isHinted(game.legalMoveHints, "column", column);
              const lineActive =
                (activeAxis === "row" && activeIndex === row) ||
                (activeAxis === "column" && activeIndex === column);
              const hinted =
                game.phase === "two-step-first" ||
                game.phase === "two-step-second"
                  ? rowHint || colHint
                  : false;

              return (
                <button
                  key={`${row}-${column}`}
                  id={`${boardId}-${row}-${column}`}
                  type="button"
                  role="gridcell"
                  aria-label={cellLabel(game.board, row, column)}
                  aria-selected={selected}
                  disabled={disabled}
                  tabIndex={0}
                  className={[
                    "relative flex items-center justify-center rounded-lg transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a202]",
                    cell ? "bg-white/35" : "bg-white/15",
                    lineActive ? "bg-[#f0a202]/35" : "",
                    hinted ? "ring-2 ring-[#2f80a8]/70" : "",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  onPointerDown={(e) => handlePointerDown(e, row, column)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishPointer}
                  onPointerCancel={() => {
                    pointerStart.current = null;
                    setDragAxis(null);
                    setDragIndex(null);
                    setDragDirection(null);
                  }}
                  onKeyDown={(e) => onKeyDownCell(e, row, column)}
                  onFocus={() => {
                    // Keep tab order manageable within board via arrows
                  }}
                >
                  {cell && (
                    <Ball
                      color={cell as BallColor}
                      selected={selected}
                      collecting={collectingKey.has(`${row}:${column}`)}
                      className={
                        activeAxis && lineActive
                          ? activeDirection === "left" ||
                            activeDirection === "up"
                            ? "animate-nudge-start"
                            : "animate-nudge-end"
                          : ""
                      }
                    />
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {(game.phase === "two-step-first" ||
        game.phase === "two-step-second") &&
        game.legalMoveHints &&
        game.legalMoveHints.length > 0 && (
          <p className="mt-2 text-center text-sm text-[#1a4d6d]">
            {game.phase === "two-step-first"
              ? "מצב שני מהלכים: בחרו מהלך הכנה מהשורות/העמודות המסומנות."
              : "כעת בצעו מהלך שיוצר קבוצה מהשורות/העמודות המסומנות."}
          </p>
        )}
    </div>
  );
}
