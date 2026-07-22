import type { BallColor } from "./types";

export const BOARD_SIZE = 7;
export const BALLS_PER_COLOR = 8;
export const POINT_TARGET = 5;
export const BALLS_PER_POINT = 3;
export const GAME_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const GAME_STATE_VERSION = 1;
export const CENTER_INDEX = Math.floor(BOARD_SIZE / 2);
export const TOTAL_BALLS = BALLS_PER_COLOR * 6;
export const MAX_BOARD_GENERATION_ATTEMPTS = 200;

export const BALL_COLORS: BallColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
];

export const COLOR_LABELS_HE: Record<BallColor, string> = {
  red: "אדום",
  blue: "כחול",
  green: "ירוק",
  yellow: "צהוב",
  purple: "סגול",
  orange: "כתום",
};

export const COLOR_CSS: Record<BallColor, string> = {
  red: "#e53935",
  blue: "#1e88e5",
  green: "#43a047",
  yellow: "#fdd835",
  purple: "#8e24aa",
  orange: "#fb8c00",
};

export function emptyCollected(): Record<BallColor, number> {
  return {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    purple: 0,
    orange: 0,
  };
}
