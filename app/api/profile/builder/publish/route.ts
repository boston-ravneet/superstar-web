import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { requireAcceptedTerms } from "@/lib/api/require-terms";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getBuilderProfile, publishBuilderProfile } from "@/lib/db/profile-builder";
import { getRequestWebBase } from "@/lib/api/request-web-base";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireBuilderAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const termsBlocked = await requireAcceptedTerms(auth.bindings.DB, auth.accountId);
    if (termsBlocked) {
      return termsBlocked;
    }

    const payload = (await request.json()) as { profileId?: string };

    if (!payload.profileId?.trim()) {
      return jsonError("Field 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    const owned = await requireProfileOwnership(
      auth.bindings.DB,
      auth.accountId,
      payload.profileId,
    );

    if (!owned) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    await publishBuilderProfile(auth.bindings.DB, payload.profileId, {
      accountId: auth.accountId,
    });

    const profile = await getBuilderProfile(auth.bindings.DB, payload.profileId);
    const webBase = getRequestWebBase(request);

    return jsonOk({
      profileId: payload.profileId,
      username: profile?.username,
      publishStatus: "published",
      publicUrl: profile
        ? `${webBase}/${encodeURIComponent(profile.username)}`
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to publish your stage.";
    return jsonError(message, "BUILDER_PUBLISH_FAILED", 500);
  }
}
