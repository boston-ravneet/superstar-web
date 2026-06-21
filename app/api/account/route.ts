import { getBindings } from "@/lib/cloudflare/env";
import { getSessionSecret } from "@/lib/auth/session-secret";
import {
  extractBearerToken,
  verifyAccountSessionToken,
} from "@/lib/auth/account-session";
import { getAccountById, mapAccountRecord } from "@/lib/db/accounts";
import { jsonError, jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return jsonError("Authorization bearer token is required.", "AUTH_REQUIRED", 401);
    }

    const bindings = await getBindings();
    const session = await verifyAccountSessionToken(getSessionSecret(bindings), token);

    if (!session) {
      return jsonError("Session is invalid or expired.", "SESSION_INVALID", 401);
    }

    const account = await getAccountById(bindings.DB, session.accountId);
    if (!account) {
      return jsonError("Account not found.", "ACCOUNT_NOT_FOUND", 404);
    }

    return jsonOk({ account: mapAccountRecord(account) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load account.";
    return jsonError(message, "ACCOUNT_ME_FAILED", 500);
  }
}
