import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getBuilderProfile,
  resolveBuilderInputForEdit,
} from "@/lib/db/profile-builder";
import { getRecentStageGenerationLogs } from "@/lib/ai/stage-generation-log";
import { getProfileAnalyticsSummary } from "@/lib/db/profile-analytics";
import { parseStageTemplate } from "@/lib/stage/parse-stage-template";
import { getRequestWebBase } from "@/lib/api/request-web-base";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireBuilderAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return jsonError("Query parameter 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    const owned = await requireProfileOwnership(
      auth.bindings.DB,
      auth.accountId,
      profileId,
    );

    if (!owned) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    const profile = await getBuilderProfile(auth.bindings.DB, profileId);
    if (!profile) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    const template = parseStageTemplate(profile.stage_template_json);
    const webBase = getRequestWebBase(request);
    const builderInput = resolveBuilderInputForEdit(profile);
    const analytics =
      profile.publish_status === "published"
        ? await getProfileAnalyticsSummary(auth.bindings.DB, profile.id)
        : null;

    return jsonOk({
      profileId: profile.id,
      username: profile.username,
      displayName: profile.display_name ?? profile.username,
      publishStatus: profile.publish_status,
      generationError: profile.generation_error,
      recentGenerationLogs: getRecentStageGenerationLogs().slice(0, 5),
      bioDisplayMode: builderInput.bioDisplayMode ?? "polished",
      originalBio: builderInput.bio,
      template,
      builderInput,
      analytics,
      previewUrl: `${webBase}/preview/${encodeURIComponent(profile.username)}`,
      publicUrl: `${webBase}/${encodeURIComponent(profile.username)}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch builder status.";
    return jsonError(message, "BUILDER_STATUS_FAILED", 500);
  }
}
