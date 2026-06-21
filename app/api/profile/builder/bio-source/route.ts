import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { setBioDisplayMode } from "@/lib/db/profile-builder";
import type { BuilderBioSourcePayload } from "@/lib/types/stage-template";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireBuilderAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const payload = (await request.json()) as BuilderBioSourcePayload;

    if (!payload.profileId?.trim()) {
      return jsonError("Field 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    if (typeof payload.useOriginalBio !== "boolean") {
      return jsonError(
        "Field 'useOriginalBio' must be true or false.",
        "BIO_SOURCE_REQUIRED",
        400,
      );
    }

    const owned = await requireProfileOwnership(
      auth.bindings.DB,
      auth.accountId,
      payload.profileId,
    );

    if (!owned) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    const result = await setBioDisplayMode(
      auth.bindings.DB,
      payload.profileId,
      payload.useOriginalBio,
      { accountId: auth.accountId },
    );

    return jsonOk({
      profileId: payload.profileId,
      bioDisplayMode: result.bioDisplayMode,
      useOriginalBio: result.bioDisplayMode === "original",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update bio display.";
    return jsonError(message, "BUILDER_BIO_SOURCE_FAILED", 500);
  }
}
