import { getBindings } from "@/lib/cloudflare/env";
import { getSessionSecret } from "@/lib/auth/session-secret";
import {
  createAccountSessionToken,
  getAccountSessionExpiryTimestamp,
} from "@/lib/auth/account-session";
import {
  mapAccountRecord,
  upsertAccount,
} from "@/lib/db/accounts";
import { verifyGoogleIdToken } from "@/lib/auth/verify-oauth-tokens";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { AccountAuthResponse, GoogleAuthPayload } from "@/lib/types/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GoogleAuthPayload;

    if (!payload.idToken?.trim()) {
      return jsonError("Field 'idToken' is required.", "ID_TOKEN_REQUIRED", 400);
    }

    const bindings = await getBindings();
    const googleClientId =
      typeof bindings.GOOGLE_CLIENT_ID === "string"
        ? bindings.GOOGLE_CLIENT_ID
        : undefined;

    const identity = await verifyGoogleIdToken(payload.idToken, googleClientId);
    const accountRecord = await upsertAccount(bindings.DB, {
      provider: "google",
      subject: identity.subject,
      email: identity.email,
      displayName: identity.displayName,
    });

    const expiresAt = getAccountSessionExpiryTimestamp();
    const sessionToken = await createAccountSessionToken(
      getSessionSecret(bindings),
      accountRecord.id,
      expiresAt,
    );

    const response: AccountAuthResponse = {
      account: mapAccountRecord(accountRecord),
      sessionToken,
      expiresAt,
    };

    return jsonOk(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google sign-in failed.";
    return jsonError(message, "GOOGLE_AUTH_FAILED", 401);
  }
}
