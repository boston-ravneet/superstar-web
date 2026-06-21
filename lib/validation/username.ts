import {
  isPremiumLockedUsername,
  normalizeUsername,
} from "@/lib/constants/premium-usernames";

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,28}[a-z0-9])?$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;

export interface UsernameValidationResult {
  valid: boolean;
  normalized: string;
  locked: boolean;
  error?: string;
  code?: string;
}

export function validateUsernameFormat(raw: string): UsernameValidationResult {
  const normalized = normalizeUsername(raw);

  if (normalized.length < MIN_USERNAME_LENGTH) {
    return {
      valid: false,
      normalized,
      locked: false,
      error: "Username must be at least 3 characters.",
      code: "USERNAME_TOO_SHORT",
    };
  }

  if (normalized.length > MAX_USERNAME_LENGTH) {
    return {
      valid: false,
      normalized,
      locked: false,
      error: "Username must be 30 characters or fewer.",
      code: "USERNAME_TOO_LONG",
    };
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      valid: false,
      normalized,
      locked: false,
      error:
        "Username may only contain lowercase letters, numbers, dots, underscores, and hyphens.",
      code: "USERNAME_INVALID_CHARS",
    };
  }

  if (isPremiumLockedUsername(normalized)) {
    return {
      valid: false,
      normalized,
      locked: true,
      error: "This handle is reserved for a verified public figure.",
      code: "USERNAME_PREMIUM_LOCKED",
    };
  }

  return { valid: true, normalized, locked: false };
}
