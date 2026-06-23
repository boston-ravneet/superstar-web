import {
  requireBuilderAuth,
  requireProfileOwnership,
} from "@/lib/api/builder-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getProfileAnalyticsSummary } from "@/lib/db/profile-analytics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireBuilderAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const profileId = new URL(request.url).searchParams.get("profileId")?.trim();
    if (!profileId) {
      return jsonError("Query param 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    const owned = await requireProfileOwnership(
      auth.bindings.DB,
      auth.accountId,
      profileId,
    );

    if (!owned) {
      return jsonError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    const summary = await getProfileAnalyticsSummary(auth.bindings.DB, profileId);

    return jsonOk(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load analytics report.";
    return jsonError(message, "ANALYTICS_REPORT_FAILED", 500);
  }
}
