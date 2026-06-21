import { getBindings } from "@/lib/cloudflare/env";
import { getSessionSecret } from "@/lib/auth/session-secret";
import {
  extractBearerToken,
  verifyAccountSessionToken,
} from "@/lib/auth/account-session";
import { profileOwnedByAccount } from "@/lib/db/accounts";
import { jsonError } from "@/lib/api/response";

export interface BuilderAuthContext {
  accountId: string;
  bindings: Awaited<ReturnType<typeof getBindings>> & { GEMINI_API_KEY?: string };
}

export async function requireBuilderAuth(
  request: Request,
): Promise<BuilderAuthContext | Response> {
  const token = extractBearerToken(request);
  if (!token) {
    return jsonError("Sign in to manage your stage.", "AUTH_REQUIRED", 401);
  }

  const bindings = await getBindings();
  const session = await verifyAccountSessionToken(
    getSessionSecret(bindings),
    token,
  );

  if (!session) {
    return jsonError("Session is invalid or expired.", "SESSION_INVALID", 401);
  }

  const env = bindings as BuilderAuthContext["bindings"];
  return { accountId: session.accountId, bindings: env };
}

export async function requireProfileOwnership(
  db: D1Database,
  accountId: string,
  profileId: string,
): Promise<boolean> {
  return profileOwnedByAccount(db, accountId, profileId);
}
