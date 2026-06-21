import { getBindings } from "@/lib/cloudflare/env";
import { verifySessionToken } from "@/lib/auth/session";
import { updateProfileByUserId } from "@/lib/db/profiles";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { ProfileUpdatePayload } from "@/lib/types/layout";
import { serializeLayoutConfig } from "@/lib/stage/parse-layout-config";
import { validateProfileUpdatePayload } from "@/lib/validation/profile-update";

export const runtime = "nodejs";

import { getSessionSecret } from "@/lib/auth/session-secret";
function extractSessionToken(request: Request, payload: ProfileUpdatePayload): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return payload.sessionToken?.trim() ?? null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProfileUpdatePayload;
    const validation = validateProfileUpdatePayload(payload);

    if (!validation.valid || !validation.layoutConfig) {
      return jsonError(
        validation.error ?? "Profile update payload is invalid.",
        validation.code ?? "PROFILE_UPDATE_INVALID",
        400,
      );
    }

    const sessionToken = extractSessionToken(request, payload);

    if (!sessionToken) {
      return jsonError(
        "A valid session token is required via Authorization header or payload.",
        "SESSION_TOKEN_REQUIRED",
        401,
      );
    }

    const bindings = await getBindings();
    const session = await verifySessionToken(
      getSessionSecret(bindings),
      sessionToken,
    );

    if (!session) {
      return jsonError("Session token is invalid or expired.", "SESSION_INVALID", 401);
    }

    if (session.userId !== payload.userId.trim()) {
      return jsonError(
        "Session userId does not match update payload userId.",
        "SESSION_USER_MISMATCH",
        403,
      );
    }

    const updatedProfile = await updateProfileByUserId(bindings.DB, {
      userId: payload.userId.trim(),
      displayName: payload.displayName,
      bio: payload.bio,
      profileImageUrl: payload.profileImageUrl,
      layoutConfigJson: serializeLayoutConfig(validation.layoutConfig),
    });

    if (!updatedProfile) {
      return jsonError(
        "Profile update failed. User ID not found or mutation rejected.",
        "PROFILE_UPDATE_NOT_FOUND",
        404,
      );
    }

    return jsonOk({ profile: updatedProfile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update profile.";
    return jsonError(message, "PROFILE_UPDATE_FAILED", 500);
  }
}
