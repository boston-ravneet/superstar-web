import type { ProfileBuilderInput } from "@/lib/types/stage-template";
import { wantsCircularImages } from "@/lib/ai/design-theme";
import { resolveBuilderMedia } from "@/lib/stage/builder-media";
import { buildShowreelVideos } from "@/lib/stage/video-embed";

export function portfolioGalleryImages(
  input: ProfileBuilderInput,
  designHints = "",
  options?: {
    existingImages?: Array<{ url?: string; caption?: string; span?: number }>;
    firstImageSpan?: number;
  },
): Array<{ url: string; caption?: string; span?: number }> {
  const media = resolveBuilderMedia(input);
  const circular = wantsCircularImages(designHints);
  const existingImages = options?.existingImages ?? [];

  return media.portfolioImages
    .map((entry) => entry.url?.trim())
    .filter((url): url is string => Boolean(url))
    .map((url, index) => {
      const existingCaption = existingImages[index]?.caption?.trim();
      const portfolioCaption = media.portfolioImages[index]?.caption?.trim();
      const caption = portfolioCaption || existingCaption;
      const genericCaption =
        !caption ||
        /^photo\s*\d+$/i.test(caption) ||
        caption.toLowerCase() === "featured";

      return {
        url,
        caption: circular || genericCaption ? undefined : caption,
        span: circular
          ? 1
          : (existingImages[index]?.span ??
            (index === 0 ? (options?.firstImageSpan ?? 2) : 1)),
      };
    });
}

export function showreelSectionVideos(input: ProfileBuilderInput) {
  const media = resolveBuilderMedia(input);
  return buildShowreelVideos(media.showreelVideos);
}

export function builderHeadshotUrl(input: ProfileBuilderInput): string {
  return resolveBuilderMedia(input).headshotUrl?.trim() ?? input.imageUrls[0] ?? "";
}
