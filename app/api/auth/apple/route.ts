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
import { verifyAppleIdentityToken } from "@/lib/auth/verify-oauth-tokens";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { AccountAuthResponse, AppleAuthPayload } from "@/lib/types/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AppleAuthPayload;

    if (!payload.identityToken?.trim()) {
      return jsonError(
        "Field 'identityToken' is required.",
        "IDENTITY_TOKEN_REQUIRED",
        400,
      );
    }

    const bindings = await getBindings();
    const identity = await verifyAppleIdentityToken(
      payload.identityToken,
      payload.email,
    );

    const accountRecord = await upsertAccount(bindings.DB, {
      provider: "apple",
      subject: identity.subject,
      email: identity.email,
      displayName: payload.fullName ?? null,
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
      error instanceof Error ? error.message : "Apple sign-in failed.";
    return jsonError(message, "APPLE_AUTH_FAILED", 401);
  }
}
