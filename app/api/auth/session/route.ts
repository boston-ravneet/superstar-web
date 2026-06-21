import { getBindings } from "@/lib/cloudflare/env";
import {
  createSessionToken,
  getSessionExpiryTimestamp,
  verifySessionToken,
} from "@/lib/auth/session";
import { getProfileRecordById } from "@/lib/db/profiles";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { SessionLoginPayload, SessionLoginResponse } from "@/lib/types/layout";
import { normalizeUsername } from "@/lib/constants/premium-usernames";

export const runtime = "nodejs";

import { getSessionSecret } from "@/lib/auth/session-secret";
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SessionLoginPayload;

    if (!payload.userId?.trim() || !payload.username?.trim()) {
      return jsonError(
        "Fields 'userId' and 'username' are required.",
        "SESSION_FIELDS_REQUIRED",
        400,
      );
    }

    const normalizedUsername = normalizeUsername(payload.username);
    const bindings = await getBindings();
    const record = await getProfileRecordById(bindings.DB, payload.userId.trim());

    if (!record) {
      return jsonError("Profile not found for session login.", "SESSION_USER_NOT_FOUND", 404);
    }

    if (normalizeUsername(record.username) !== normalizedUsername) {
      return jsonError(
        "Session login username does not match profile record.",
        "SESSION_USERNAME_MISMATCH",
        403,
      );
    }

    const expiresAt = getSessionExpiryTimestamp();
    const sessionToken = await createSessionToken(
      getSessionSecret(bindings),
      {
        userId: record.id,
        username: record.username,
      },
      expiresAt,
    );

    const response: SessionLoginResponse = {
      userId: record.id,
      username: record.username,
      sessionToken,
      expiresAt,
    };

    return jsonOk(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to establish session.";
    return jsonError(message, "SESSION_LOGIN_FAILED", 500);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get("sessionToken");

    if (!sessionToken) {
      return jsonError("Query parameter 'sessionToken' is required.", "SESSION_TOKEN_REQUIRED", 400);
    }

    const bindings = await getBindings();
    const session = await verifySessionToken(
      getSessionSecret(bindings),
      sessionToken,
    );

    if (!session) {
      return jsonError("Session token is invalid or expired.", "SESSION_INVALID", 401);
    }

    return jsonOk({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify session.";
    return jsonError(message, "SESSION_VERIFY_FAILED", 500);
  }
}
