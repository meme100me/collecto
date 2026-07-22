import { createHmac, timingSafeEqual } from "crypto";
import type { GameState } from "@/lib/game/types";
import { getGameStateSecret, getTokenMaxAgeMs } from "./environment";

function toBase64Url(input: Buffer | string): string {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64");
}

function signPayload(payload: string, secret: string): string {
  return toBase64Url(
    createHmac("sha256", secret).update(payload).digest(),
  );
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function createStateToken(state: GameState, secret?: string): string {
  const resolvedSecret = secret ?? getGameStateSecret();
  const payload = toBase64Url(JSON.stringify(state));
  const signature = signPayload(payload, resolvedSecret);
  return `${payload}.${signature}`;
}

export type TokenVerificationResult =
  | { ok: true; state: GameState }
  | { ok: false; error: string; status: number };

export function verifyStateToken(
  token: string,
  secret?: string,
): TokenVerificationResult {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { ok: false, error: "token חסר או פגום.", status: 401 };
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return { ok: false, error: "token פגום.", status: 401 };
  }

  const resolvedSecret = secret ?? getGameStateSecret();
  const expected = signPayload(payload, resolvedSecret);
  if (!safeEqual(signature, expected)) {
    return { ok: false, error: "חתימת token אינה תקינה.", status: 401 };
  }

  let state: GameState;
  try {
    const json = fromBase64Url(payload).toString("utf8");
    state = JSON.parse(json) as GameState;
  } catch {
    return { ok: false, error: "לא ניתן לפענח את מצב המשחק.", status: 400 };
  }

  if (
    !state ||
    typeof state !== "object" ||
    typeof state.createdAt !== "number" ||
    !state.board ||
    !state.gameId
  ) {
    return { ok: false, error: "מצב משחק לא תקין.", status: 400 };
  }

  const age = Date.now() - state.createdAt;
  if (age > getTokenMaxAgeMs() || age < 0) {
    return {
      ok: false,
      error: "פג תוקף המשחק. התחילו משחק חדש.",
      status: 401,
    };
  }

  return { ok: true, state };
}
