import type { OAuthIdentityPayload } from "@/lib/types/profile";
import { normalizeUsername } from "@/lib/constants/premium-usernames";

export interface OAuthValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

function normalizeHandle(handle: string): string {
  return normalizeUsername(handle);
}

export function validateOAuthHandleMatch(
  requestedUsername: string,
  oauth: OAuthIdentityPayload,
): OAuthValidationResult {
  const username = normalizeHandle(requestedUsername);
  const oauthHandle = normalizeHandle(oauth.handle);

  if (!oauthHandle) {
    return {
      valid: false,
      error: "OAuth identity did not include a public handle.",
      code: "OAUTH_HANDLE_MISSING",
    };
  }

  if (username !== oauthHandle) {
    return {
      valid: false,
      error: `Registration handle "${username}" must match your connected ${oauth.provider} handle "@${oauthHandle}".`,
      code: "OAUTH_HANDLE_MISMATCH",
    };
  }

  if (!oauth.subject || oauth.subject.trim().length === 0) {
    return {
      valid: false,
      error: "OAuth identity token is missing a subject identifier.",
      code: "OAUTH_SUBJECT_MISSING",
    };
  }

  return { valid: true };
}
