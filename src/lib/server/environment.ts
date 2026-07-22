import { GAME_TOKEN_MAX_AGE_MS } from "@/lib/game/constants";

export function getGameStateSecret(): string {
  const secret = process.env.GAME_STATE_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "חסר משתנה סביבה GAME_STATE_SECRET (לפחות 16 תווים). צרו קובץ .env.local.",
    );
  }
  return secret;
}

export function getCacheCoordinates(): string {
  const coordinates = process.env.CACHE_COORDINATES;
  if (!coordinates || coordinates.trim().length === 0) {
    throw new Error(
      "חסר משתנה סביבה CACHE_COORDINATES. צרו קובץ .env.local עם הקואורדינטות.",
    );
  }
  return coordinates;
}

export function getTokenMaxAgeMs(): number {
  return GAME_TOKEN_MAX_AGE_MS;
}
