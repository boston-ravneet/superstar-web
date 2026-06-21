import { getBindings } from "@/lib/cloudflare/env";
import { getSessionSecret } from "@/lib/auth/session-secret";
import {
  extractBearerToken,
  verifyAccountSessionToken,
} from "@/lib/auth/account-session";
import {
  createProfile,
  getProfileByUsername,
  usernameExists,
} from "@/lib/db/profiles";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { RegistrationPayload } from "@/lib/types/profile";
import { validateRegistrationPayload } from "@/lib/validation/registration";
import { validateUsernameFormat } from "@/lib/validation/username";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return jsonError("Query parameter 'username' is required.", "USERNAME_REQUIRED", 400);
    }

    const { DB } = await getBindings();
    const profile = await getProfileByUsername(DB, username);

    if (!profile) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    return jsonOk({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch profile.";
    return jsonError(message, "PROFILE_FETCH_FAILED", 500);
  }
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return jsonError(
        "Sign in with Apple or Google before claiming a handle.",
        "AUTH_REQUIRED",
        401,
      );
    }

    const bindings = await getBindings();
    const accountSession = await verifyAccountSessionToken(
      getSessionSecret(bindings),
      token,
    );

    if (!accountSession) {
      return jsonError("Session is invalid or expired.", "SESSION_INVALID", 401);
    }

    const payload = (await request.json()) as RegistrationPayload;
    const validation = validateRegistrationPayload(payload);

    if (!validation.valid) {
      return jsonError(
        validation.error ?? "Registration payload is invalid.",
        validation.code ?? "REGISTRATION_INVALID",
        validation.isLocked ? 403 : 400,
      );
    }

    const { DB } = bindings;
    const exists = await usernameExists(DB, validation.normalizedUsername);

    if (exists) {
      return jsonError(
        "This handle is already registered.",
        "USERNAME_TAKEN",
        409,
      );
    }

    const profile = await createProfile(
      DB,
      {
        ...payload,
        username: validation.normalizedUsername,
      },
      {
        isLocked: validation.isLocked,
        accountId: accountSession.accountId,
      },
    );

    return jsonOk({ profile }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create profile.";
    return jsonError(message, "PROFILE_CREATE_FAILED", 500);
  }
}
