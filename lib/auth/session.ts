import type { SessionLoginPayload } from "@/lib/types/layout";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface VerifiedSession {
  userId: string;
  username: string;
  expiresAt: number;
}

async function signPayload(
  secret: string,
  payload: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(
  secret: string,
  session: SessionLoginPayload,
  expiresAtMs: number,
): Promise<string> {
  const payload = `${session.userId}:${session.username}:${expiresAtMs}`;
  const signature = await signPayload(secret, payload);
  return `${payload}:${signature}`;
}

export async function verifySessionToken(
  secret: string,
  token: string,
): Promise<VerifiedSession | null> {
  const parts = token.split(":");
  if (parts.length !== 4) {
    return null;
  }

  const [userId, username, expiresAtRaw, providedSignature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!userId || !username || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  const payload = `${userId}:${username}:${expiresAt}`;
  const expectedSignature = await signPayload(secret, payload);

  if (expectedSignature !== providedSignature) {
    return null;
  }

  return { userId, username, expiresAt };
}

export function getSessionExpiryTimestamp(): number {
  return Date.now() + SESSION_TTL_MS;
}
