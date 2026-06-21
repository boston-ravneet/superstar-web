import type { LayoutConfig } from "@/lib/types/layout";
import type { StageTemplateDocument } from "@/lib/types/stage-template";

export function templateToLayoutConfig(
  template: StageTemplateDocument,
  imageUrls: string[],
): LayoutConfig {
  const gallerySection = template.sections.find((section) => section.type === "gallery");
  const skillsSection = template.sections.find((section) => section.type === "skills");
  const ctaSection = template.sections.find((section) => section.type === "cta");

  const galleryFromTemplate = Array.isArray(gallerySection?.content.images)
    ? (gallerySection.content.images as Array<{ url?: string; caption?: string }>)
        .filter((image) => typeof image.url === "string")
        .map((image) => ({
          url: image.url as string,
          caption: typeof image.caption === "string" ? image.caption : undefined,
        }))
    : [];

  const gallery_urls =
    galleryFromTemplate.length > 0
      ? galleryFromTemplate
      : imageUrls.map((url, index) => ({
          url,
          caption: index === 0 ? "Featured" : `Photo ${index + 1}`,
        }));

  const skill_tags = Array.isArray(skillsSection?.content.tags)
    ? (skillsSection.content.tags as unknown[])
        .filter((tag): tag is string => typeof tag === "string")
        .slice(0, 12)
    : [];

  const themeFromPalette = template.palette.primary.toLowerCase();
  let theme_template: LayoutConfig["theme_template"] = "neon-fuchsia";

  if (themeFromPalette.includes("amber") || themeFromPalette.includes("gold")) {
    theme_template = "midnight-gold";
  } else if (themeFromPalette.includes("fuchsia") || themeFromPalette.includes("d946ef")) {
    theme_template = "neon-fuchsia";
  } else if (themeFromPalette.includes("zinc") || themeFromPalette.includes("slate")) {
    theme_template = "clean-slate";
  } else if (themeFromPalette.includes("090") || themeFromPalette.includes("000")) {
    theme_template = "cinema-noir";
  }

  return {
    theme_template,
    showreel_videos: [],
    gallery_urls,
    skill_tags,
    booking_label:
      typeof ctaSection?.content.label === "string"
        ? ctaSection.content.label
        : "Get in touch",
    booking_href:
      typeof ctaSection?.content.href === "string"
        ? ctaSection.content.href
        : undefined,
  };
}
