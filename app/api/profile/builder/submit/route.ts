import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { requireAcceptedTerms } from "@/lib/api/require-terms";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ContentModerationError } from "@/lib/ai/moderate-upload-images";
import {
  getBuilderProfile,
  runTemplateGeneration,
  saveBuilderInput,
} from "@/lib/db/profile-builder";
import {
  prepareBuilderMediaPayload,
  validateShowreelVideos,
} from "@/lib/stage/builder-media";
import { validateShowreelUrl } from "@/lib/stage/video-embed";
import type { BuilderSubmitPayload, ProfileBuilderInput } from "@/lib/types/stage-template";

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

    const payload = (await request.json()) as BuilderSubmitPayload;

    if (!payload.profileId?.trim()) {
      return jsonError("Field 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    if (!payload.bio?.trim()) {
      return jsonError("Tell us a little about yourself.", "BIO_REQUIRED", 400);
    }

    const rawImageUrls = Array.isArray(payload.imageUrls)
      ? payload.imageUrls.filter((url): url is string => typeof url === "string")
      : [];

    const prepared = prepareBuilderMediaPayload(rawImageUrls, payload.media);
    if (!("media" in prepared)) {
      return jsonError(
        prepared.error ?? "Upload your headshot and portfolio photos.",
        prepared.code ?? "MEDIA_REQUIRED",
        400,
      );
    }

    const showreelValidation = validateShowreelVideos(
      prepared.media.showreelVideos,
      validateShowreelUrl,
    );
    if (!showreelValidation.valid) {
      return jsonError(
        showreelValidation.error ?? "Invalid showreel link.",
        showreelValidation.code ?? "SHOWREEL_INVALID_URL",
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

    const profile = await getBuilderProfile(auth.bindings.DB, payload.profileId);
    if (!profile) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    const designInstructions =
      payload.designInstructions?.trim() ||
      payload.extraDetails?.trim() ||
      undefined;

    const builderInput: ProfileBuilderInput = {
      bio: payload.bio.trim(),
      designInstructions,
      imageUrls: prepared.imageUrls,
      media: prepared.media,
      displayName: profile.display_name ?? profile.username,
      username: profile.username,
      instagramHandle: profile.instagram_handle,
      tiktokHandle: profile.tiktok_handle,
      preferredArchetypeId: payload.preferredArchetypeId,
      socialAccounts: payload.socialAccounts,
    };

    await saveBuilderInput(auth.bindings.DB, payload.profileId, builderInput, {
      accountId: auth.accountId,
    });

    const generation = await runTemplateGeneration(
      auth.bindings.DB,
      payload.profileId,
      auth.bindings.GEMINI_API_KEY,
      undefined,
      { accountId: auth.accountId },
    );

    const updated = await getBuilderProfile(auth.bindings.DB, payload.profileId);

    return jsonOk({
      profileId: payload.profileId,
      username: profile.username,
      publishStatus: updated?.publish_status ?? "preview",
      generationSource: generation.source,
      generationError: generation.error ?? updated?.generation_error ?? null,
      estimatedMinutes: 2,
      message:
        generation.source === "gemini"
          ? "AI design ready for preview."
          : `Local builder used${generation.error ? `: ${generation.error}` : ""}. Check server logs [stage-builder].`,
    });
  } catch (error) {
    if (error instanceof ContentModerationError) {
      return jsonError(error.message, error.code, 422);
    }
    const message =
      error instanceof Error ? error.message : "Unable to build your stage.";
    return jsonError(message, "BUILDER_SUBMIT_FAILED", 500);
  }
}
