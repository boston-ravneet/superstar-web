import type { ProfileUpdatePayload } from "@/lib/types/layout";
import { validateLayoutConfig } from "@/lib/stage/parse-layout-config";

export interface ProfileUpdateValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  layoutConfig?: ReturnType<typeof validateLayoutConfig>;
}

export function validateProfileUpdatePayload(
  payload: ProfileUpdatePayload,
): ProfileUpdateValidationResult {
  if (!payload.userId?.trim()) {
    return {
      valid: false,
      error: "Field 'userId' is required.",
      code: "USER_ID_REQUIRED",
    };
  }

  if (!payload.sessionToken?.trim()) {
    return {
      valid: false,
      error: "Field 'sessionToken' is required.",
      code: "SESSION_TOKEN_REQUIRED",
    };
  }

  if (!payload.layout_config) {
    return {
      valid: false,
      error: "Field 'layout_config' is required.",
      code: "LAYOUT_CONFIG_REQUIRED",
    };
  }

  if (payload.displayName !== undefined && payload.displayName.trim().length === 0) {
    return {
      valid: false,
      error: "Display name cannot be empty when provided.",
      code: "DISPLAY_NAME_INVALID",
    };
  }

  const layoutConfig = validateLayoutConfig(payload.layout_config);

  for (const video of layoutConfig.showreel_videos) {
    try {
      new URL(video.url);
    } catch {
      return {
        valid: false,
        error: `Invalid showreel URL: ${video.url}`,
        code: "SHOWREEL_URL_INVALID",
      };
    }
  }

  for (const photo of layoutConfig.gallery_urls) {
    try {
      new URL(photo.url);
    } catch {
      return {
        valid: false,
        error: `Invalid gallery URL: ${photo.url}`,
        code: "GALLERY_URL_INVALID",
      };
    }
  }

  if (layoutConfig.booking_href) {
    try {
      if (!layoutConfig.booking_href.startsWith("mailto:")) {
        new URL(layoutConfig.booking_href);
      }
    } catch {
      return {
        valid: false,
        error: "Booking href must be a valid URL or mailto link.",
        code: "BOOKING_HREF_INVALID",
      };
    }
  }

  return {
    valid: true,
    layoutConfig,
  };
}
