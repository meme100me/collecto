import type { Move } from "@/lib/game/types";
import { BOARD_SIZE } from "@/lib/game/constants";

const MAX_BODY_BYTES = 32_768;

export class ValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new ValidationError("גוף הבקשה גדול מדי.", 413);
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    throw new ValidationError("גוף הבקשה גדול מדי.", 413);
  }

  if (!text.trim()) {
    throw new ValidationError("גוף הבקשה ריק.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ValidationError("JSON לא תקין.");
  }
}

export function parseMove(raw: unknown): Move {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("מהלך חסר או לא תקין.");
  }

  const move = raw as Record<string, unknown>;
  const axis = move.axis;
  const index = move.index;
  const direction = move.direction;

  if (typeof index !== "number" || !Number.isInteger(index)) {
    throw new ValidationError("אינדקס המהלך חייב להיות מספר שלם.");
  }

  if (index < 0 || index >= BOARD_SIZE) {
    throw new ValidationError("אינדקס המהלך מחוץ לטווח.");
  }

  if (axis === "row") {
    if (direction !== "left" && direction !== "right") {
      throw new ValidationError("כיוון שורה חייב להיות left או right.");
    }
    return { axis: "row", index, direction };
  }

  if (axis === "column") {
    if (direction !== "up" && direction !== "down") {
      throw new ValidationError("כיוון עמודה חייב להיות up או down.");
    }
    return { axis: "column", index, direction };
  }

  throw new ValidationError("ציר המהלך חייב להיות row או column.");
}

export function parseMoveRequest(body: unknown): {
  stateToken: string;
  move: Move;
} {
  if (!body || typeof body !== "object") {
    throw new ValidationError("גוף בקשה לא תקין.");
  }

  const data = body as Record<string, unknown>;
  if (typeof data.stateToken !== "string" || !data.stateToken) {
    throw new ValidationError("stateToken חסר.", 401);
  }

  return {
    stateToken: data.stateToken,
    move: parseMove(data.move),
  };
}

export function errorResponse(
  error: unknown,
  fallbackMessage = "שגיאת שרת.",
): Response {
  const isDev = process.env.NODE_ENV === "development";

  if (error instanceof ValidationError) {
    return Response.json(
      { error: error.message },
      { status: error.status },
    );
  }

  if (error instanceof Error) {
    const message =
      error.message.includes("משתנה סביבה") ||
      error.message.includes("GAME_STATE_SECRET") ||
      error.message.includes("CACHE_COORDINATES")
        ? error.message
        : fallbackMessage;

    return Response.json(
      {
        error: message,
        ...(isDev && !message.includes("משתנה")
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }

  return Response.json({ error: fallbackMessage }, { status: 500 });
}
