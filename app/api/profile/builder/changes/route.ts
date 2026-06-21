import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getProfileChangeLogs } from "@/lib/db/profile-change-log";

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

    const logs = await getProfileChangeLogs(auth.bindings.DB, profileId);

    return jsonOk({
      profileId,
      logs: logs.map((entry) => ({
        id: entry.id,
        event: entry.event,
        detail: entry.detail_json ? JSON.parse(entry.detail_json) : null,
        createdAt: entry.created_at,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch change logs.";
    return jsonError(message, "BUILDER_CHANGES_FAILED", 500);
  }
}
