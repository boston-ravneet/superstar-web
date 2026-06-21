import { getBindings } from "@/lib/cloudflare/env";
import { usernameExists } from "@/lib/db/profiles";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { UsernameCheckResult } from "@/lib/types/profile";
import { validateUsernameFormat } from "@/lib/validation/username";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return jsonError("Query parameter 'username' is required.", "USERNAME_REQUIRED", 400);
    }

    const validation = validateUsernameFormat(username);
    const result: UsernameCheckResult = {
      username: validation.normalized,
      available: false,
      locked: validation.locked,
    };

    if (!validation.valid) {
      result.available = false;
      result.reason = validation.error;
      return jsonOk(result);
    }

    const { DB } = await getBindings();
    const exists = await usernameExists(DB, validation.normalized);

    result.available = !exists;
    if (exists) {
      result.reason = "This handle is already taken.";
    }

    return jsonOk(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check username.";
    return jsonError(message, "USERNAME_CHECK_FAILED", 500);
  }
}
