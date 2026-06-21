import { getBindings } from "@/lib/cloudflare/env";
import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getBuilderProfile,
  runTemplateGeneration,
  saveBuilderInput,
} from "@/lib/db/profile-builder";
import type { BuilderSubmitPayload, ProfileBuilderInput } from "@/lib/types/stage-template";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireBuilderAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const payload = (await request.json()) as BuilderSubmitPayload;

    if (!payload.profileId?.trim()) {
      return jsonError("Field 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    if (!payload.bio?.trim()) {
      return jsonError("Tell us a little about yourself.", "BIO_REQUIRED", 400);
    }

    if (!Array.isArray(payload.imageUrls) || payload.imageUrls.length !== 3) {
      return jsonError(
        "Upload exactly 3 photos for your stage.",
        "IMAGES_REQUIRED",
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
      imageUrls: payload.imageUrls,
      displayName: profile.display_name ?? profile.username,
      username: profile.username,
      instagramHandle: profile.instagram_handle,
      tiktokHandle: profile.tiktok_handle,
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
      estimatedMinutes: 5,
      message:
        generation.source === "gemini"
          ? "AI design ready for preview."
          : `Local builder used${generation.error ? `: ${generation.error}` : ""}. Check server logs [stage-builder].`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to build your stage.";
    return jsonError(message, "BUILDER_SUBMIT_FAILED", 500);
  }
}
