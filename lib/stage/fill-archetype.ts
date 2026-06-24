import type { ProfileBuilderInput, StageTemplateDocument } from "@/lib/types/stage-template";
import { summarizeBioProfessionally, sanitizeSkillTags } from "@/lib/ai/bio-copy";
import { combineDesignHints } from "@/lib/ai/design-theme";
import { finalizeStageTemplate } from "@/lib/stage/enrich-stage-template";
import { applyDesignThemeHints } from "@/lib/ai/design-theme";
import { applyCanvasMotif } from "@/lib/stage/canvas-motifs";
import { buildCtaContent } from "@/lib/stage/resolve-connect-actions";
import {
  normalizeSocialAccounts,
  socialAccountsToBuilderHandles,
} from "@/lib/stage/social-accounts";
import {
  builderHeadshotUrl,
  portfolioGalleryImages,
  showreelSectionVideos,
} from "@/lib/stage/media-sections";
import {
  getArchetypeById,
  DEFAULT_ARCHETYPE_ID,
  type CreatorClassification,
} from "@/lib/stage/archetypes";

function cloneTemplate(template: StageTemplateDocument): StageTemplateDocument {
  return JSON.parse(JSON.stringify(template)) as StageTemplateDocument;
}

/** Hydrates a curated archetype with creator-specific copy, photos, and links. */
export function buildFromArchetype(
  input: ProfileBuilderInput,
  classification: CreatorClassification,
  refinePrompt?: string,
): StageTemplateDocument {
  const archetype =
    getArchetypeById(classification.archetypeId) ??
    getArchetypeById(DEFAULT_ARCHETYPE_ID)!;

  const copy = summarizeBioProfessionally(input.bio, input.displayName);
  const skillCandidates = sanitizeSkillTags(
    copy.tags.length > 0
      ? copy.tags
      : input.bio
          .split(/[,.]/)
          .map((part) => part.trim())
          .filter((part) => part.length > 3 && part.length < 24),
  );

  const hints = combineDesignHints(input.designInstructions, refinePrompt);
  const template = cloneTemplate(archetype.base);

  template.meta = {
    title: input.displayName,
    tagline: copy.tagline,
  };

  template.sections = template.sections.map((section) => {
    if (section.type === "hero") {
      return {
        ...section,
        content: {
          ...section.content,
          headline: input.displayName,
          handle: input.username,
          subheadline: copy.tagline,
          avatarUrl: builderHeadshotUrl(input),
        },
      };
    }

    if (section.type === "social") {
      const accounts = normalizeSocialAccounts(input.socialAccounts ?? []);
      const legacy = socialAccountsToBuilderHandles(accounts);
      return {
        ...section,
        visible: accounts.length > 0,
        content: {
          accounts: accounts.map((account) => ({
            platform: account.platform,
            handle: account.handle,
            verified: Boolean(account.verified),
          })),
          instagramHandle: legacy.instagramHandle ?? null,
          tiktokHandle: legacy.tiktokHandle ?? null,
        },
      };
    }

    if (section.type === "showreel") {
      const videos = showreelSectionVideos(input);
      return {
        ...section,
        visible: videos.length > 0,
        content: {
          ...section.content,
          title: String(section.content.title ?? "Showreel & Trailers"),
          videos,
        },
      };
    }

    if (section.type === "gallery") {
      const isGoldLedger = classification.archetypeId === "gold-ledger";
      const images = portfolioGalleryImages(input, hints, {
        firstImageSpan: isGoldLedger ? 2 : 2,
      });

      return {
        ...section,
        visible: images.length > 0,
        content: {
          ...section.content,
          title: archetype.galleryTitle,
          images,
        },
      };
    }

    if (section.type === "bio") {
      return {
        ...section,
        visible: Boolean(input.bio.trim()),
        content: {
          ...section.content,
          text: copy.about,
        },
      };
    }

    if (section.type === "skills") {
      return {
        ...section,
        visible: skillCandidates.length > 0,
        content: {
          title: archetype.skillsTitle,
          tags: skillCandidates,
        },
      };
    }

    if (section.type === "quote") {
      return {
        ...section,
        visible: Boolean(copy.tagline),
        content: {
          text: copy.tagline,
          author: input.displayName,
        },
      };
    }

    if (section.type === "cta") {
      const cta = buildCtaContent(input, archetype.ctaLabel);
      return {
        ...section,
        content: {
          label: cta.label,
          href: cta.href,
          actions: cta.actions,
        },
      };
    }

    return section;
  });

  const themed = applyDesignThemeHints(template, hints);
  const withMotif = applyCanvasMotif(themed, input, classification, hints);
  return finalizeStageTemplate(withMotif, input, hints);
}
