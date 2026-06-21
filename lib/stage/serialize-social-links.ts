import type { SocialLink } from "@/lib/types/profile";
import type { SocialLinksPayload } from "@/lib/types/stage";

export function serializeSocialLinksPayload(
  links: SocialLink[] | undefined,
  extras?: Omit<SocialLinksPayload, "links">,
): string {
  if (!links?.length && !extras) {
    return "[]";
  }

  if (!extras) {
    return JSON.stringify(links ?? []);
  }

  return JSON.stringify({
    links: links ?? [],
    ...extras,
  });
}
