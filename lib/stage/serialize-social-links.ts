import type { SocialLink } from "@/lib/types/profile";
import type { SocialLinksPayload } from "@/lib/types/stage";

export function serializeSocialLinksPayload(
  links: SocialLink[] | undefined,
  extras?: Omit<SocialLinksPayload, "links">,
): string {
  const hasAccounts = Boolean(extras?.accounts?.length);
  if (!links?.length && !extras && !hasAccounts) {
    return "[]";
  }

  if (!extras && !hasAccounts) {
    return JSON.stringify(links ?? []);
  }

  return JSON.stringify({
    links: links ?? [],
    ...extras,
  });
}
