import { createInitialGameState, toPublicGameState } from "@/lib/game/game-engine";
import { createStateToken } from "@/lib/server/state-token";
import { errorResponse } from "@/lib/server/validation";
import { getGameStateSecret } from "@/lib/server/environment";

export async function POST() {
  try {
    // Ensure secret exists early so misconfiguration is clear
    getGameStateSecret();

    const state = createInitialGameState();
    const stateToken = createStateToken(state);
    const game = toPublicGameState(state);

    return Response.json({ stateToken, game });
  } catch (error) {
    return errorResponse(error, "לא ניתן להתחיל משחק חדש.");
  }
}
