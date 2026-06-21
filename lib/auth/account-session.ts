const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface VerifiedAccountSession {
  accountId: string;
  expiresAt: number;
}

async function signPayload(secret: string, payload: string): Promise<string> {
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

export async function createAccountSessionToken(
  secret: string,
  accountId: string,
  expiresAtMs: number,
): Promise<string> {
  const payload = `account:${accountId}:${expiresAtMs}`;
  const signature = await signPayload(secret, payload);
  return `${payload}:${signature}`;
}

export async function verifyAccountSessionToken(
  secret: string,
  token: string,
): Promise<VerifiedAccountSession | null> {
  const marker = "account:";
  if (!token.startsWith(marker)) {
    return null;
  }

  const body = token.slice(marker.length);
  const parts = body.split(":");
  if (parts.length !== 3) {
    return null;
  }

  const [accountId, expiresAtRaw, providedSignature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (!accountId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  const payload = `account:${accountId}:${expiresAt}`;
  const expectedSignature = await signPayload(secret, payload);

  if (expectedSignature !== providedSignature) {
    return null;
  }

  return { accountId, expiresAt };
}

export function getAccountSessionExpiryTimestamp(): number {
  return Date.now() + SESSION_TTL_MS;
}

export function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice("Bearer ".length).trim();
}
