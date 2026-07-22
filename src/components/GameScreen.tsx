"use client";

import { useEffect, useState } from "react";
import type { Move, PublicGameState } from "@/lib/game/types";
import { POINT_TARGET } from "@/lib/game/constants";
import { GameBoard } from "./GameBoard";
import { ScorePanel } from "./ScorePanel";
import { DirectionControls } from "./DirectionControls";
import { HelpDialog } from "./HelpDialog";
import { RestartDialog } from "./RestartDialog";
import { WinScreen } from "./WinScreen";
import { LoseScreen } from "./LoseScreen";
import { LiveAnnouncement } from "./LiveAnnouncement";

interface GameScreenProps {
  game: PublicGameState;
  coordinates: string | null;
  busy: boolean;
  shake: boolean;
  message: string;
  networkError: string | null;
  collectingCells?: Array<{ row: number; column: number }>;
  onMove: (move: Move) => void;
  onRestart: () => void;
  onBackToInstructions: () => void;
  onRetryNetwork: () => void;
}

export function GameScreen({
  game,
  coordinates,
  busy,
  shake,
  message,
  networkError,
  collectingCells = [],
  onMove,
  onRestart,
  onBackToInstructions,
  onRetryNetwork,
}: GameScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    column: number;
  } | null>(null);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    if (selectedCell && showTip) {
      const t = window.setTimeout(() => setShowTip(false), 6000);
      return () => window.clearTimeout(t);
    }
  }, [selectedCell, showTip]);

  const progress = Math.min(100, (game.score / game.targetScore) * 100);
  const boardLocked =
    busy || game.phase === "won" || game.phase === "lost";

  function handleDirection(direction: "up" | "down" | "left" | "right") {
    if (!selectedCell || boardLocked) return;
    if (direction === "left" || direction === "right") {
      onMove({
        axis: "row",
        index: selectedCell.row,
        direction,
      });
    } else {
      onMove({
        axis: "column",
        index: selectedCell.column,
        direction,
      });
    }
  }

  if (game.phase === "won" && coordinates) {
    return (
      <div className="space-y-4">
        <LiveAnnouncement message={message} />
        <WinScreen
          coordinates={coordinates}
          moves={game.moves}
          onPlayAgain={onRestart}
          onBackToInstructions={onBackToInstructions}
          loading={busy}
        />
      </div>
    );
  }

  if (game.phase === "lost") {
    return (
      <div className="space-y-4">
        <LiveAnnouncement message={message} />
        <LoseScreen
          score={game.score}
          targetScore={game.targetScore}
          onTryAgain={onRestart}
          loading={busy}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LiveAnnouncement message={message} />

      <header className="rounded-2xl bg-white/80 border border-[#d2e2ec] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#12324a]">
              קולקטו - אתגר הקואורדינטות
            </h1>
            <p className="text-sm text-[#4d6577]">מהלכים: {game.moves}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-[#9fb8c9] px-3 py-2 text-sm font-semibold text-[#1a4d6d] hover:bg-white"
              onClick={() => setHelpOpen(true)}
            >
              עזרה
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#e0b39a] px-3 py-2 text-sm font-semibold text-[#a84c1f] hover:bg-[#fff6ee]"
              onClick={() => setRestartOpen(true)}
            >
              התחל מחדש
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-end justify-between mb-1">
            <span className="text-sm font-semibold text-[#1a4d6d]">ניקוד</span>
            <span className="text-2xl font-black text-[#12324a] tabular-nums">
              {game.score} / {game.targetScore || POINT_TARGET}
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#e6eef4] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#2f80a8] to-[#1a4d6d] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {message && (
          <p
            className="mt-3 rounded-xl bg-[#eef6fb] px-3 py-2 text-sm text-[#1a4d6d]"
            role="status"
          >
            {message}
          </p>
        )}

        {networkError && (
          <div
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            <p>{networkError}</p>
            <button
              type="button"
              className="mt-1 font-semibold underline"
              onClick={onRetryNetwork}
            >
              נסה שוב
            </button>
          </div>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="space-y-4">
          <GameBoard
            game={game}
            disabled={boardLocked}
            shake={shake}
            onMove={(move) => {
              setSelectedCell(null);
              onMove(move);
            }}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            showFirstTip={showTip}
            collectingCells={collectingCells}
          />

          {selectedCell && (
            <DirectionControls
              disabled={boardLocked}
              onDirection={handleDirection}
            />
          )}
        </div>

        <ScorePanel game={game} />
      </div>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <RestartDialog
        open={restartOpen}
        onCancel={() => setRestartOpen(false)}
        loading={busy}
        onConfirm={() => {
          setRestartOpen(false);
          onRestart();
        }}
      />
    </div>
  );
}
