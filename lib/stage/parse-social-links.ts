import type { SocialLink } from "@/lib/types/profile";
import type { SocialLinksPayload } from "@/lib/types/stage";

export function parseSocialLinksPayload(raw: string | null): SocialLinksPayload {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as SocialLinksPayload | SocialLink[];

    if (Array.isArray(parsed)) {
      return { links: parsed };
    }

    return parsed ?? {};
  } catch {
    return {};
  }
}

export function parseSocialLinks(raw: string | null): SocialLink[] {
  return parseSocialLinksPayload(raw).links ?? [];
}
