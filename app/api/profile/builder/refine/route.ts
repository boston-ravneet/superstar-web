import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getBuilderProfile,
  runTemplateGeneration,
} from "@/lib/db/profile-builder";
import type { BuilderRefinePayload } from "@/lib/types/stage-template";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireBuilderAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const payload = (await request.json()) as BuilderRefinePayload;

    if (!payload.profileId?.trim()) {
      return jsonError("Field 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    if (!payload.prompt?.trim()) {
      return jsonError("Tell us what you'd like to change.", "PROMPT_REQUIRED", 400);
    }

    const owned = await requireProfileOwnership(
      auth.bindings.DB,
      auth.accountId,
      payload.profileId,
    );

    if (!owned) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    const generation = await runTemplateGeneration(
      auth.bindings.DB,
      payload.profileId,
      auth.bindings.GEMINI_API_KEY,
      payload.prompt.trim(),
      { accountId: auth.accountId },
    );

    const profile = await getBuilderProfile(auth.bindings.DB, payload.profileId);

    return jsonOk({
      profileId: payload.profileId,
      publishStatus: profile?.publish_status ?? "preview",
      generationSource: generation.source,
      generationError: generation.error ?? profile?.generation_error ?? null,
      template: generation.template,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to refine your stage.";
    return jsonError(message, "BUILDER_REFINE_FAILED", 500);
  }
}
