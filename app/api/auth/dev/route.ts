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
import { jsonError, jsonOk } from "@/lib/api/response";
import type { AccountAuthResponse } from "@/lib/types/account";

export const runtime = "nodejs";

interface DevAuthPayload {
  provider?: "apple" | "google";
  email?: string;
  displayName?: string;
}

export async function POST(request: Request) {
  try {
    const bindings = await getBindings();

    if (bindings.ALLOW_DEV_AUTH !== "true") {
      return jsonError("Dev auth is disabled.", "DEV_AUTH_DISABLED", 403);
    }

    const payload = (await request.json()) as DevAuthPayload;
    const provider = payload.provider ?? "google";
    const subject = `dev-${provider}-${payload.email ?? "guest"}-${Date.now()}`;

    const accountRecord = await upsertAccount(bindings.DB, {
      provider,
      subject,
      email: payload.email ?? `${provider}.dev@getsuperstar.info`,
      displayName: payload.displayName ?? "Dev Creator",
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
      error instanceof Error ? error.message : "Dev auth failed.";
    return jsonError(message, "DEV_AUTH_FAILED", 500);
  }
}
