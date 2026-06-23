import { getBindings } from "@/lib/cloudflare/env";
import { getSessionSecret } from "@/lib/auth/session-secret";
import {
  extractBearerToken,
  verifyAccountSessionToken,
} from "@/lib/auth/account-session";
import { listProfilesForAccount } from "@/lib/db/accounts";
import { getProfileAnalyticsSummary } from "@/lib/db/profile-analytics";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { AccountProfileSummary } from "@/lib/types/account";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return jsonError("Authorization bearer token is required.", "AUTH_REQUIRED", 401);
    }

    const bindings = await getBindings();
    const session = await verifyAccountSessionToken(getSessionSecret(bindings), token);

    if (!session) {
      return jsonError("Session is invalid or expired.", "SESSION_INVALID", 401);
    }

    const rows = await listProfilesForAccount(bindings.DB, session.accountId);
    const profiles: AccountProfileSummary[] = await Promise.all(
      rows.map(async (row) => {
        const publishStatus = (row.publish_status ??
          "draft") as AccountProfileSummary["publishStatus"];
        const analytics =
          publishStatus === "published"
            ? await getProfileAnalyticsSummary(bindings.DB, row.id)
            : null;

        return {
          id: row.id,
          username: row.username,
          displayName: row.display_name ?? row.username,
          profileImageUrl: row.profile_image_url,
          publishStatus,
          isVerified: row.is_verified === 1,
          isLocked: row.is_locked === 1,
          totalViews: analytics?.totalViews ?? 0,
          viewsLast7Days: analytics?.viewsLast7Days ?? 0,
        };
      }),
    );

    return jsonOk({ profiles });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to list profiles.";
    return jsonError(message, "ACCOUNT_PROFILES_FAILED", 500);
  }
}
