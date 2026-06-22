import type { ProfileBuilderInput, StageTemplateDocument } from "@/lib/types/stage-template";
import { summarizeBioProfessionally, sanitizeSkillTags } from "@/lib/ai/bio-copy";
import { combineDesignHints } from "@/lib/ai/design-theme";
import { finalizeStageTemplate } from "@/lib/stage/enrich-stage-template";
import { applyDesignThemeHints } from "@/lib/ai/design-theme";
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

  const circular =
    template.assets?.galleryImageBorderRadius === "50%";

  template.sections = template.sections.map((section) => {
    if (section.type === "hero") {
      return {
        ...section,
        content: {
          ...section.content,
          headline: input.displayName,
          handle: input.username,
          subheadline: copy.tagline,
          avatarUrl: input.imageUrls[0] ?? "",
        },
      };
    }

    if (section.type === "social") {
      const hasSocial = input.instagramHandle || input.tiktokHandle;
      return {
        ...section,
        visible: Boolean(hasSocial),
        content: {
          instagramHandle: input.instagramHandle ?? null,
          tiktokHandle: input.tiktokHandle ?? null,
        },
      };
    }

    if (section.type === "gallery") {
      const isGoldLedger = classification.archetypeId === "gold-ledger";
      const images = input.imageUrls.map((url, index) => ({
        url,
        span: circular
          ? 1
          : isGoldLedger && index === 0
            ? 2
            : index === 0
              ? 2
              : 1,
      }));

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
      return {
        ...section,
        content: {
          label: archetype.ctaLabel,
          href: `mailto:hello@getsuperstar.info?subject=Booking%20@${input.username}`,
        },
      };
    }

    return section;
  });

  const themed = applyDesignThemeHints(template, hints);
  return finalizeStageTemplate(themed, input, hints);
}
