"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CellCoord,
  Move,
  MoveResponse,
  PublicGameState,
  StartGameResponse,
  WinningMoveResponse,
} from "@/lib/game/types";
import { pushLine } from "@/lib/game/push-line";
import { InstructionsScreen } from "@/components/InstructionsScreen";
import { GameScreen } from "@/components/GameScreen";

type AppPhase = "instructions" | "playing";

const COLLECT_BLINK_MS = 2000;

function getCollectBlinkMs(): number {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return 0;
  }
  return COLLECT_BLINK_MS;
}

export function CollectoApp() {
  const [appPhase, setAppPhase] = useState<AppPhase>("instructions");
  const [stateToken, setStateToken] = useState<string | null>(null);
  const [game, setGame] = useState<PublicGameState | null>(null);
  const [coordinates, setCoordinates] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [collectingCells, setCollectingCells] = useState<CellCoord[]>([]);
  const lastMoveRef = useRef<Move | null>(null);
  const inFlightRef = useRef(false);
  const collectingRef = useRef(false);
  const collectTimerRef = useRef<number | null>(null);

  const clearCollectTimer = useCallback(() => {
    if (collectTimerRef.current !== null) {
      window.clearTimeout(collectTimerRef.current);
      collectTimerRef.current = null;
    }
    collectingRef.current = false;
  }, []);

  useEffect(() => () => clearCollectTimer(), [clearCollectTimer]);

  const startGame = useCallback(async () => {
    clearCollectTimer();
    setCollectingCells([]);
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setError(null);
    setNetworkError(null);

    try {
      const response = await fetch("/api/game/start", { method: "POST" });
      const data = (await response.json()) as StartGameResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "לא ניתן להתחיל משחק.");
      }

      setStateToken(data.stateToken);
      setGame(data.game);
      setCoordinates(null);
      setMessage(data.game.message ?? "משחק חדש התחיל. בהצלחה!");
      setAppPhase("playing");
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "שגיאת רשת. נסו שוב.";
      setError(text);
    } finally {
      setBusy(false);
      inFlightRef.current = false;
    }
  }, [clearCollectTimer]);

  const submitMove = useCallback(
    async (move: Move) => {
      if (!stateToken || !game || inFlightRef.current) return;
      if (game.phase === "won" || game.phase === "lost") return;
      if (collectingRef.current) return;

      inFlightRef.current = true;
      lastMoveRef.current = move;
      setBusy(true);
      setNetworkError(null);

      try {
        const response = await fetch("/api/game/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stateToken, move }),
        });

        const data = (await response.json()) as (
          | MoveResponse
          | WinningMoveResponse
        ) & { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "לא ניתן לבצע את המהלך.");
        }

        setStateToken(data.stateToken);
        setMessage(data.result.message);

        if (!data.result.valid) {
          setShake(true);
          window.setTimeout(() => setShake(false), 350);
          setGame(data.game);
          setBusy(false);
          inFlightRef.current = false;
          return;
        }

        const cells = data.result.collectedCells ?? [];
        const winCoordinates =
          "coordinates" in data && data.coordinates
            ? data.coordinates
            : null;

        if (cells.length > 0) {
          const boardAfterPush = pushLine(game.board, move);
          setGame({
            ...game,
            board: boardAfterPush,
            moves: data.game.moves,
            message: data.result.message,
          });
          collectingRef.current = true;
          setCollectingCells(cells);
          setBusy(false);
          inFlightRef.current = false;

          const blinkMs = getCollectBlinkMs();
          if (collectTimerRef.current !== null) {
            window.clearTimeout(collectTimerRef.current);
          }
          collectTimerRef.current = window.setTimeout(() => {
            collectTimerRef.current = null;
            collectingRef.current = false;
            setCollectingCells([]);
            setGame(data.game);
            setMessage(data.result.message);
            if (winCoordinates) {
              setCoordinates(winCoordinates);
            }
          }, blinkMs);
          return;
        }

        setGame(data.game);
        if (winCoordinates) {
          setCoordinates(winCoordinates);
        }
        setBusy(false);
        inFlightRef.current = false;
      } catch (err) {
        const text =
          err instanceof Error ? err.message : "שגיאת רשת. נסו שוב.";
        setNetworkError(text);
        setBusy(false);
        inFlightRef.current = false;
      }
    },
    [game, stateToken],
  );

  const retryLastMove = useCallback(() => {
    if (lastMoveRef.current) {
      void submitMove(lastMoveRef.current);
    }
  }, [submitMove]);

  const collecting = collectingCells.length > 0;

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#ffe8d2_0%,transparent_42%),radial-gradient(circle_at_90%_0%,#d7eef8_0%,transparent_40%),linear-gradient(160deg,#f4f8fb_0%,#e7f0f6_45%,#f8f1e8_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%231a4d6d\\' fill-opacity=\\'0.06\\'%3E%3Ccircle cx=\\'30\\' cy=\\'30\\' r=\\'2\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
        {appPhase === "instructions" || !game ? (
          <InstructionsScreen
            onStart={() => void startGame()}
            loading={busy}
            error={error}
            onRetry={() => void startGame()}
          />
        ) : (
          <GameScreen
            game={game}
            coordinates={coordinates}
            busy={busy || collecting}
            shake={shake}
            message={message}
            networkError={networkError}
            collectingCells={collectingCells}
            onMove={(move) => void submitMove(move)}
            onRestart={() => void startGame()}
            onBackToInstructions={() => {
              clearCollectTimer();
              setCollectingCells([]);
              setAppPhase("instructions");
              setGame(null);
              setStateToken(null);
              setCoordinates(null);
              setMessage("");
            }}
            onRetryNetwork={retryLastMove}
          />
        )}
      </div>
    </main>
  );
}
