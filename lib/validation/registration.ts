import type { RegistrationPayload } from "@/lib/types/profile";
import { validateUsernameFormat } from "@/lib/validation/username";
import { validateOAuthHandleMatch } from "@/lib/validation/oauth";

export interface RegistrationValidationResult {
  valid: boolean;
  normalizedUsername: string;
  isLocked: boolean;
  error?: string;
  code?: string;
}

export function validateRegistrationPayload(
  payload: RegistrationPayload,
): RegistrationValidationResult {
  const usernameResult = validateUsernameFormat(payload.username);

  if (!usernameResult.valid) {
    return {
      valid: false,
      normalizedUsername: usernameResult.normalized,
      isLocked: usernameResult.locked,
      error: usernameResult.error,
      code: usernameResult.code,
    };
  }

  if (!payload.oauth?.provider) {
    return {
      valid: false,
      normalizedUsername: usernameResult.normalized,
      isLocked: false,
      error: "An Instagram or TikTok OAuth identity is required.",
      code: "OAUTH_PROVIDER_REQUIRED",
    };
  }

  if (
    payload.oauth.provider !== "instagram" &&
    payload.oauth.provider !== "tiktok"
  ) {
    return {
      valid: false,
      normalizedUsername: usernameResult.normalized,
      isLocked: false,
      error: "Only Instagram and TikTok OAuth providers are supported.",
      code: "OAUTH_PROVIDER_UNSUPPORTED",
    };
  }

  const oauthResult = validateOAuthHandleMatch(
    usernameResult.normalized,
    payload.oauth,
  );

  if (!oauthResult.valid) {
    return {
      valid: false,
      normalizedUsername: usernameResult.normalized,
      isLocked: false,
      error: oauthResult.error,
      code: oauthResult.code,
    };
  }

  return {
    valid: true,
    normalizedUsername: usernameResult.normalized,
    isLocked: false,
  };
}
