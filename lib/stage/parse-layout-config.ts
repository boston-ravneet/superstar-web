import type {
  LayoutConfig,
  LayoutGalleryInput,
  LayoutShowreelInput,
  ThemeTemplate,
} from "@/lib/types/layout";
import { DEFAULT_LAYOUT_CONFIG } from "@/lib/types/layout";

function isThemeTemplate(value: string): value is ThemeTemplate {
  return (
    value === "midnight-gold" ||
    value === "neon-fuchsia" ||
    value === "clean-slate" ||
    value === "cinema-noir"
  );
}

function normalizeShowreel(entry: LayoutShowreelInput, index: number) {
  return {
    url: entry.url.trim(),
    title: entry.title?.trim() || `Showreel ${index + 1}`,
    posterUrl: entry.posterUrl?.trim(),
  };
}

function normalizeGalleryEntry(
  entry: string | LayoutGalleryInput,
  index: number,
): LayoutGalleryInput {
  if (typeof entry === "string") {
    return { url: entry.trim(), caption: `Gallery ${index + 1}` };
  }

  return {
    url: entry.url.trim(),
    caption: entry.caption?.trim() || `Gallery ${index + 1}`,
  };
}

export function parseLayoutConfig(raw: string | null): LayoutConfig {
  if (!raw) {
    return DEFAULT_LAYOUT_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LayoutConfig>;
    const theme = parsed.theme_template ?? DEFAULT_LAYOUT_CONFIG.theme_template;

    return {
      theme_template: isThemeTemplate(theme) ? theme : DEFAULT_LAYOUT_CONFIG.theme_template,
      showreel_videos: (parsed.showreel_videos ?? [])
        .filter((entry) => Boolean(entry?.url?.trim()))
        .map(normalizeShowreel),
      gallery_urls: (parsed.gallery_urls ?? [])
        .map(normalizeGalleryEntry)
        .filter((entry) => entry.url.length > 0),
      skill_tags: (parsed.skill_tags ?? [])
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      booking_label: parsed.booking_label?.trim(),
      booking_href: parsed.booking_href?.trim(),
    };
  } catch {
    return DEFAULT_LAYOUT_CONFIG;
  }
}

export function serializeLayoutConfig(config: LayoutConfig): string {
  return JSON.stringify({
    theme_template: config.theme_template,
    showreel_videos: config.showreel_videos,
    gallery_urls: config.gallery_urls,
    skill_tags: config.skill_tags,
    booking_label: config.booking_label,
    booking_href: config.booking_href,
  });
}

export function validateLayoutConfig(input: LayoutConfig): LayoutConfig {
  return parseLayoutConfig(JSON.stringify(input));
}
