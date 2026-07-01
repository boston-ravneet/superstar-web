import type {
  ProfileBuilderInput,
  StageTemplateDocument,
  StageTemplateSection,
} from "@/lib/types/stage-template";
import { sanitizeSkillTags } from "@/lib/ai/bio-copy";
import { DEFAULT_LAYOUT, DEFAULT_STYLE } from "@/lib/stage/template-defaults";
import { buildCtaContent } from "@/lib/stage/resolve-connect-actions";
import {
  mergeSocialAccountSources,
  normalizeSocialAccounts,
  socialAccountsToBuilderHandles,
} from "@/lib/stage/social-accounts";
import {
  imageUrlsFromMedia,
  mediaFromLegacyImageUrls,
  normalizeBuilderMedia,
} from "@/lib/stage/builder-media";
import {
  builderHeadshotUrl,
  portfolioGalleryImages,
  showreelSectionVideos,
} from "@/lib/stage/media-sections";
import { applyRichBioSections } from "@/lib/stage/apply-rich-bio-sections";
import { ensureReadablePalette } from "@/lib/stage/ensure-readable-palette";

export function normalizeBuilderInput(
  raw: unknown,
    profile?: {
    instagram_handle?: string | null;
    tiktok_handle?: string | null;
    display_name?: string | null;
    username?: string;
    bio?: string | null;
    social_links_json?: string | null;
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

  const imageUrls = value.imageUrls.filter(
    (url): url is string => typeof url === "string",
  );
  const media =
    normalizeBuilderMedia(value.media) ?? mediaFromLegacyImageUrls(imageUrls);

  return {
    bio: value.bio,
    designInstructions:
      typeof value.designInstructions === "string"
        ? value.designInstructions
        : legacyInstructions,
    imageUrls: imageUrlsFromMedia(media),
    media,
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
    preferredArchetypeId:
      value.preferredArchetypeId === "field-day" ||
      value.preferredArchetypeId === "midnight-creator" ||
      value.preferredArchetypeId === "studio-clean" ||
      value.preferredArchetypeId === "gold-ledger"
        ? value.preferredArchetypeId
        : undefined,
    socialAccounts: Array.isArray(value.socialAccounts)
      ? normalizeSocialAccounts(
          value.socialAccounts as Array<Record<string, unknown>>,
        )
      : mergeSocialAccountSources({
          socialLinksJson: profile?.social_links_json,
          instagramHandle:
            typeof value.instagramHandle === "string"
              ? value.instagramHandle
              : profile?.instagram_handle,
          tiktokHandle:
            typeof value.tiktokHandle === "string"
              ? value.tiktokHandle
              : profile?.tiktok_handle,
        }),
  };
}

function buildShowreelSection(input: ProfileBuilderInput): StageTemplateSection | null {
  const videos = showreelSectionVideos(input);
  if (videos.length === 0) {
    return null;
  }

  return {
    id: "showreel",
    type: "showreel",
    order: 2,
    visible: true,
    layout: {
      ...DEFAULT_LAYOUT,
      direction: "column",
      gap: "16px",
      padding: "0 24px 20px",
    },
    style: DEFAULT_STYLE,
    content: {
      title: "Showreel & Trailers",
      videos,
    },
  };
}

function buildSocialSection(input: ProfileBuilderInput): StageTemplateSection | null {
  const accounts = normalizeSocialAccounts(input.socialAccounts ?? []);
  const legacy = socialAccountsToBuilderHandles(accounts);

  if (accounts.length === 0) {
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
  const hasShowreel = withoutInstructionLeak.some(
    (section) => section.type === "showreel",
  );

  let sections = withoutInstructionLeak;

  if (!hasShowreel) {
    const showreelSection = buildShowreelSection(input);
    if (showreelSection) {
      const socialOrder =
        sections.find((section) => section.type === "social")?.order ?? 1;
      showreelSection.order = socialOrder + 1;
      sections = [...sections, showreelSection].sort((a, b) => a.order - b.order);
    }
  }

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

      const accounts = normalizeSocialAccounts(input.socialAccounts ?? []);
      const legacy = socialAccountsToBuilderHandles(accounts);

      return {
        ...section,
        visible: accounts.length > 0,
        content: {
          ...section.content,
          accounts: accounts.map((account) => ({
            platform: account.platform,
            handle: account.handle,
            verified: Boolean(account.verified),
          })),
          instagramHandle: legacy.instagramHandle ?? section.content.instagramHandle,
          tiktokHandle: legacy.tiktokHandle ?? section.content.tiktokHandle,
        },
      };
    });
  }

  sections = sections.map((section) => {
    if (section.type === "hero" && builderHeadshotUrl(input)) {
      return {
        ...section,
        content: {
          ...section.content,
          avatarUrl: builderHeadshotUrl(input),
          headline: section.content.headline ?? input.displayName,
          handle: section.content.handle ?? input.username,
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
          videos,
        },
      };
    }

    if (section.type === "gallery") {
      const existingImages = Array.isArray(section.content.images)
        ? (section.content.images as Array<{ url?: string; caption?: string; span?: number }>)
        : [];

      const images = portfolioGalleryImages(input, designHints, {
        existingImages,
      });

      return {
        ...section,
        visible: images.length > 0,
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

    if (section.type === "cta") {
      const fallbackLabel =
        typeof section.content.label === "string"
          ? section.content.label
          : "Let's connect";
      const cta = buildCtaContent(input, fallbackLabel);

      return {
        ...section,
        content: {
          ...section.content,
          label: cta.label,
          href: cta.href,
          actions: cta.actions,
        },
      };
    }

    return section;
  });

  return ensureReadablePalette(
    applyRichBioSections(
      {
        ...template,
        sections,
      },
      input.bio,
    ),
  );
}
