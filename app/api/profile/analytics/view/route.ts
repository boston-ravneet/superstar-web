import { getBindings } from "@/lib/cloudflare/env";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isLikelyBotUserAgent,
  recordProfilePageView,
} from "@/lib/db/profile-analytics";

export const runtime = "nodejs";

interface ViewPayload {
  profileId?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ViewPayload;
    const profileId = payload.profileId?.trim();

    if (!profileId) {
      return jsonError("Field 'profileId' is required.", "PROFILE_ID_REQUIRED", 400);
    }

    const userAgent = request.headers.get("user-agent");
    if (isLikelyBotUserAgent(userAgent)) {
      return jsonOk({ recorded: false, reason: "bot" });
    }

    const { DB } = await getBindings();

    const profile = await DB.prepare(
      `SELECT id, COALESCE(publish_status, 'draft') AS publish_status
       FROM profiles
       WHERE id = ?
       LIMIT 1`,
    )
      .bind(profileId)
      .first<{ id: string; publish_status: string }>();

    if (!profile || profile.publish_status !== "published") {
      return jsonOk({ recorded: false, reason: "not_published" });
    }

    await recordProfilePageView(DB, profileId);

    return jsonOk({ recorded: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record page view.";
    return jsonError(message, "ANALYTICS_VIEW_FAILED", 500);
  }
}
