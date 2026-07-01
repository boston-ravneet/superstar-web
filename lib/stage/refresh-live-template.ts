import type { ProfileBuilderInput, StageTemplateDocument } from "@/lib/types/stage-template";
import { applyRichBioSections } from "@/lib/stage/apply-rich-bio-sections";
import { ensureReadablePalette } from "@/lib/stage/ensure-readable-palette";
import { buildCtaContent } from "@/lib/stage/resolve-connect-actions";
import { mergeSocialAccountSources } from "@/lib/stage/social-accounts";

/** Re-applies display fixes to saved templates (contrast, CTA label, rich bio sections). */
export function refreshLiveTemplate(
  template: StageTemplateDocument,
  context: {
    bio: string;
    displayName: string;
    username: string;
    instagramHandle?: string | null;
    tiktokHandle?: string | null;
    socialLinksJson?: string | null;
    imageUrls?: string[];
  },
): StageTemplateDocument {
  const socialAccounts = mergeSocialAccountSources({
    socialLinksJson: context.socialLinksJson,
    instagramHandle: context.instagramHandle,
    tiktokHandle: context.tiktokHandle,
  });

  const builderInput: ProfileBuilderInput = {
    bio: context.bio,
    displayName: context.displayName,
    username: context.username,
    imageUrls: context.imageUrls ?? [],
    instagramHandle: context.instagramHandle,
    tiktokHandle: context.tiktokHandle,
    socialAccounts,
  };

  let refreshed = applyRichBioSections(template, context.bio);
  refreshed = ensureReadablePalette(refreshed);

  refreshed = {
    ...refreshed,
    sections: refreshed.sections.map((section) => {
      if (section.type !== "cta") {
        return section;
      }

      const cta = buildCtaContent(builderInput, "Get in touch");
      return {
        ...section,
        content: {
          ...section.content,
          label: cta.label,
          href: cta.href,
          actions: cta.actions,
        },
      };
    }),
  };

  return refreshed;
}
