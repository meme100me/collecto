import {
  applyGameMove,
  shouldRevealCoordinates,
  toPublicGameState,
} from "@/lib/game/game-engine";
import { getCacheCoordinates, getGameStateSecret } from "@/lib/server/environment";
import { createStateToken, verifyStateToken } from "@/lib/server/state-token";
import {
  errorResponse,
  parseMoveRequest,
  readJsonBody,
  ValidationError,
} from "@/lib/server/validation";
import type { MoveResponse, WinningMoveResponse } from "@/lib/game/types";

export async function POST(request: Request) {
  try {
    getGameStateSecret();

    const body = await readJsonBody<unknown>(request);
    const { stateToken, move } = parseMoveRequest(body);

    const verified = verifyStateToken(stateToken);
    if (!verified.ok) {
      throw new ValidationError(verified.error, verified.status);
    }

    if (
      verified.state.phase === "won" ||
      verified.state.phase === "lost"
    ) {
      throw new ValidationError("המשחק כבר הסתיים.", 400);
    }

    const result = applyGameMove(verified.state, move);
    const nextToken = createStateToken(result.state);
    const game = toPublicGameState(result.state, {
      message: result.message,
      legalMoveHints: result.legalMoveHints,
    });

    const response: MoveResponse = {
      stateToken: nextToken,
      game,
      result: {
        valid: result.valid,
        message: result.message,
        collectedThisMove: result.collectedThisMove,
        collectedCells: result.collectedCells,
        scoreGained: result.scoreGained,
      },
    };

    if (shouldRevealCoordinates(result.state)) {
      const winning: WinningMoveResponse = {
        ...response,
        game: {
          ...game,
          phase: "won",
        },
        coordinates: getCacheCoordinates(),
      };
      return Response.json(winning);
    }

    return Response.json(response);
  } catch (error) {
    return errorResponse(error, "לא ניתן לבצע את המהלך.");
  }
}
