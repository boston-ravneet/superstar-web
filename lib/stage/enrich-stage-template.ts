import type {
  ProfileBuilderInput,
  StageTemplateDocument,
  StageTemplateSection,
} from "@/lib/types/stage-template";
import { wantsCircularImages } from "@/lib/ai/design-theme";
import { sanitizeSkillTags } from "@/lib/ai/bio-copy";
import { DEFAULT_LAYOUT, DEFAULT_STYLE } from "@/lib/stage/template-defaults";

export function normalizeBuilderInput(
  raw: unknown,
  profile?: {
    instagram_handle?: string | null;
    tiktok_handle?: string | null;
    display_name?: string | null;
    username?: string;
    bio?: string | null;
  },
): ProfileBuilderInput | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Record<string, unknown>;
  const legacyInstructions =
    typeof value.extraDetails === "string" ? value.extraDetails : undefined;

  if (typeof value.bio !== "string" || !Array.isArray(value.imageUrls)) {
    return null;
  }

  return {
    bio: value.bio,
    designInstructions:
      typeof value.designInstructions === "string"
        ? value.designInstructions
        : legacyInstructions,
    imageUrls: value.imageUrls.filter(
      (url): url is string => typeof url === "string",
    ),
    displayName:
      typeof value.displayName === "string"
        ? value.displayName
        : profile?.display_name ?? profile?.username ?? "",
    username:
      typeof value.username === "string"
        ? value.username
        : profile?.username ?? "",
    instagramHandle:
      typeof value.instagramHandle === "string"
        ? value.instagramHandle
        : profile?.instagram_handle ?? null,
    tiktokHandle:
      typeof value.tiktokHandle === "string"
        ? value.tiktokHandle
        : profile?.tiktok_handle ?? null,
    bioDisplayMode:
      value.bioDisplayMode === "original" ? "original" : "polished",
    polishedBio:
      typeof value.polishedBio === "string" ? value.polishedBio : undefined,
    polishedTagline:
      typeof value.polishedTagline === "string"
        ? value.polishedTagline
        : undefined,
  };
}

function buildSocialSection(input: ProfileBuilderInput): StageTemplateSection | null {
  if (!input.instagramHandle && !input.tiktokHandle) {
    return null;
  }

  return {
    id: "social",
    type: "social",
    order: 1,
    visible: true,
    layout: {
      ...DEFAULT_LAYOUT,
      direction: "row",
      gap: "12px",
      padding: "0 24px 16px",
    },
    style: DEFAULT_STYLE,
    content: {
      instagramHandle: input.instagramHandle ?? null,
      tiktokHandle: input.tiktokHandle ?? null,
    },
  };
}

function highlightsFromDesignInstructions(
  section: StageTemplateSection,
  designInstructions?: string,
): boolean {
  if (section.type !== "highlights" || !designInstructions?.trim()) {
    return false;
  }

  const items = Array.isArray(section.content.items)
    ? (section.content.items as Array<{ title?: string; body?: string }>)
    : [];

  if (items.length === 0) {
    return false;
  }

  const instructionText = designInstructions.toLowerCase();
  return items.every((item) => {
    const body = (item.body ?? item.title ?? "").toLowerCase().trim();
    return body.length > 0 && instructionText.includes(body);
  });
}

export function finalizeStageTemplate(
  template: StageTemplateDocument,
  input: ProfileBuilderInput,
  designHints = "",
): StageTemplateDocument {
  const withoutInstructionLeak = template.sections.filter(
    (section) => !highlightsFromDesignInstructions(section, input.designInstructions),
  );

  const hasSocial = withoutInstructionLeak.some(
    (section) => section.type === "social",
  );

  let sections = withoutInstructionLeak;

  if (!hasSocial) {
    const socialSection = buildSocialSection(input);
    if (socialSection) {
      const heroOrder =
        sections.find((section) => section.type === "hero")?.order ?? 0;
      socialSection.order = heroOrder + 1;
      sections = [...sections, socialSection].sort((a, b) => a.order - b.order);
    }
  } else {
    sections = sections.map((section) => {
      if (section.type !== "social") {
        return section;
      }

      return {
        ...section,
        content: {
          instagramHandle: input.instagramHandle ?? section.content.instagramHandle,
          tiktokHandle: input.tiktokHandle ?? section.content.tiktokHandle,
        },
      };
    });
  }

  sections = sections.map((section) => {
    if (section.type === "hero" && input.imageUrls[0]) {
      return {
        ...section,
        content: {
          ...section.content,
          avatarUrl: input.imageUrls[0],
          headline: section.content.headline ?? input.displayName,
          handle: section.content.handle ?? input.username,
        },
      };
    }

    if (section.type === "gallery" && input.imageUrls.length > 0) {
      const existingImages = Array.isArray(section.content.images)
        ? (section.content.images as Array<{ url?: string; caption?: string; span?: number }>)
        : [];

      const circular = wantsCircularImages(designHints);

      const images = input.imageUrls.map((url, index) => {
        const existingCaption = existingImages[index]?.caption?.trim();
        const genericCaption =
          !existingCaption ||
          /^photo\s*\d+$/i.test(existingCaption) ||
          existingCaption.toLowerCase() === "featured";

        return {
          url,
          caption: circular || genericCaption ? undefined : existingCaption,
          span: circular ? 1 : (existingImages[index]?.span ?? (index === 0 ? 2 : 1)),
        };
      });

      return {
        ...section,
        visible: true,
        content: {
          ...section.content,
          images,
        },
      };
    }

    if (section.type === "skills" && Array.isArray(section.content.tags)) {
      const tags = sanitizeSkillTags(
        (section.content.tags as unknown[]).filter(
          (tag): tag is string => typeof tag === "string",
        ),
      );

      return {
        ...section,
        content: {
          ...section.content,
          tags,
        },
        visible: tags.length > 0,
      };
    }

    return section;
  });

  return {
    ...template,
    sections,
  };
}
