import { getBindings } from "@/lib/cloudflare/env";
import { getSessionSecret } from "@/lib/auth/session-secret";
import {
  extractBearerToken,
  verifyAccountSessionToken,
} from "@/lib/auth/account-session";
import {
  acceptAccountTerms,
  getAccountById,
  mapAccountRecord,
} from "@/lib/db/accounts";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms-version";
import { jsonError, jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

    let termsVersion = CURRENT_TERMS_VERSION;
    try {
      const body = (await request.json()) as { termsVersion?: string };
      if (body.termsVersion?.trim()) {
        termsVersion = body.termsVersion.trim();
      }
    } catch {
      // Empty body is fine — use current version.
    }

    if (termsVersion !== CURRENT_TERMS_VERSION) {
      return jsonError(
        "Please accept the latest Terms & Conditions.",
        "TERMS_VERSION_MISMATCH",
        400,
      );
    }

    const account = await acceptAccountTerms(
      bindings.DB,
      session.accountId,
      termsVersion,
    );

    return jsonOk({ account: mapAccountRecord(account) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record terms acceptance.";
    return jsonError(message, "ACCEPT_TERMS_FAILED", 500);
  }
}

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

    return jsonOk({
      account: mapAccountRecord(account),
      currentTermsVersion: CURRENT_TERMS_VERSION,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load terms status.";
    return jsonError(message, "TERMS_STATUS_FAILED", 500);
  }
}
