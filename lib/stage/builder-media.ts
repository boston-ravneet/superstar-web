export const BUILDER_MEDIA_LIMITS = {
  headshot: 1,
  showreelMin: 0,
  showreelMax: 2,
  portfolioMin: 4,
  portfolioMax: 6,
  /** Gemini vision cap — headshot + sample portfolio frames */
  visionMax: 3,
} as const;

export interface ShowreelVideoInput {
  url: string;
  title?: string;
}

export interface PortfolioImageInput {
  url: string;
  caption?: string;
}

export interface BuilderMediaInput {
  headshotUrl: string;
  showreelVideos: ShowreelVideoInput[];
  portfolioImages: PortfolioImageInput[];
}

export function emptyBuilderMedia(): BuilderMediaInput {
  return {
    headshotUrl: "",
    showreelVideos: [],
    portfolioImages: [],
  };
}

export function imageUrlsFromMedia(media: BuilderMediaInput): string[] {
  const portfolio = media.portfolioImages
    .map((entry) => entry.url?.trim())
    .filter(Boolean);
  return [media.headshotUrl?.trim(), ...portfolio].filter(
    (url): url is string => Boolean(url),
  );
}

export function visionImageUrlsFromMedia(media: BuilderMediaInput): string[] {
  const urls = imageUrlsFromMedia(media);
  return urls.slice(0, BUILDER_MEDIA_LIMITS.visionMax);
}

/** Legacy 3-photo profiles → structured media for edit flow. */
export function mediaFromLegacyImageUrls(imageUrls: string[]): BuilderMediaInput {
  const urls = imageUrls.filter(Boolean);
  if (urls.length === 0) {
    return emptyBuilderMedia();
  }

  const headshotUrl = urls[0] ?? "";
  const portfolio = urls.slice(1).map((url) => ({ url }));

  while (portfolio.length < BUILDER_MEDIA_LIMITS.portfolioMin && portfolio.length > 0) {
    portfolio.push({ url: portfolio[portfolio.length - 1].url });
  }

  return {
    headshotUrl,
    showreelVideos: [],
    portfolioImages: portfolio.slice(0, BUILDER_MEDIA_LIMITS.portfolioMax),
  };
}

export function normalizeBuilderMedia(raw: unknown): BuilderMediaInput | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Partial<BuilderMediaInput>;
  const headshotUrl =
    typeof value.headshotUrl === "string" ? value.headshotUrl.trim() : "";

  const showreelVideos = Array.isArray(value.showreelVideos)
    ? value.showreelVideos
        .flatMap((entry) => {
          if (!entry || typeof entry !== "object") {
            return [];
          }
          const row = entry as Partial<ShowreelVideoInput>;
          const url = typeof row.url === "string" ? row.url.trim() : "";
          if (!url) {
            return [];
          }
          const item: ShowreelVideoInput = { url };
          if (typeof row.title === "string" && row.title.trim()) {
            item.title = row.title.trim().slice(0, 120);
          }
          return [item];
        })
        .slice(0, BUILDER_MEDIA_LIMITS.showreelMax)
    : [];

  const portfolioImages = Array.isArray(value.portfolioImages)
    ? value.portfolioImages
        .flatMap((entry) => {
          if (!entry || typeof entry !== "object") {
            return [];
          }
          const row = entry as Partial<PortfolioImageInput>;
          const url = typeof row.url === "string" ? row.url.trim() : "";
          if (!url) {
            return [];
          }
          const item: PortfolioImageInput = { url };
          if (typeof row.caption === "string" && row.caption.trim()) {
            item.caption = row.caption.trim().slice(0, 120);
          }
          return [item];
        })
        .slice(0, BUILDER_MEDIA_LIMITS.portfolioMax)
    : [];

  return {
    headshotUrl,
    showreelVideos,
    portfolioImages,
  };
}

export function mergeBuilderMedia(
  imageUrls: string[],
  media?: BuilderMediaInput | null,
): BuilderMediaInput {
  if (media?.headshotUrl && media.portfolioImages.length > 0) {
    return {
      headshotUrl: media.headshotUrl,
      showreelVideos: media.showreelVideos ?? [],
      portfolioImages: media.portfolioImages,
    };
  }

  return mediaFromLegacyImageUrls(imageUrls);
}

export interface BuilderMediaValidation {
  valid: boolean;
  error?: string;
  code?: string;
}

export function resolveBuilderMedia(input: {
  imageUrls: string[];
  media?: BuilderMediaInput | null;
}): BuilderMediaInput {
  return mergeBuilderMedia(input.imageUrls, input.media);
}

export function prepareBuilderMediaPayload(
  imageUrls: string[],
  rawMedia?: unknown,
): { media: BuilderMediaInput; imageUrls: string[] } | BuilderMediaValidation {
  const normalized = rawMedia ? normalizeBuilderMedia(rawMedia) : null;

  const media =
    normalized?.headshotUrl?.trim() &&
    normalized.portfolioImages.filter((entry) => entry.url?.trim()).length >=
      BUILDER_MEDIA_LIMITS.portfolioMin
      ? normalized
      : mediaFromLegacyImageUrls(imageUrls);

  const validation = validateBuilderMedia(media);
  if (!validation.valid) {
    return validation;
  }

  return {
    media,
    imageUrls: imageUrlsFromMedia(media),
  };
}

export function validateBuilderMedia(media: BuilderMediaInput): BuilderMediaValidation {
  if (!media.headshotUrl?.trim()) {
    return {
      valid: false,
      error: "Upload a profile headshot (square photo).",
      code: "HEADSHOT_REQUIRED",
    };
  }

  const portfolioCount = media.portfolioImages.filter((entry) =>
    entry.url?.trim(),
  ).length;

  if (portfolioCount < BUILDER_MEDIA_LIMITS.portfolioMin) {
    return {
      valid: false,
      error: `Add at least ${BUILDER_MEDIA_LIMITS.portfolioMin} portfolio photos (up to ${BUILDER_MEDIA_LIMITS.portfolioMax}).`,
      code: "PORTFOLIO_REQUIRED",
    };
  }

  if (portfolioCount > BUILDER_MEDIA_LIMITS.portfolioMax) {
    return {
      valid: false,
      error: `Portfolio is limited to ${BUILDER_MEDIA_LIMITS.portfolioMax} photos.`,
      code: "PORTFOLIO_TOO_MANY",
    };
  }

  if (media.showreelVideos.length > BUILDER_MEDIA_LIMITS.showreelMax) {
    return {
      valid: false,
      error: `You can add up to ${BUILDER_MEDIA_LIMITS.showreelMax} showreel or trailer links.`,
      code: "SHOWREEL_TOO_MANY",
    };
  }

  return { valid: true };
}

export function validateShowreelVideos(
  videos: ShowreelVideoInput[],
  validateUrl: (url: string) => boolean,
): BuilderMediaValidation {
  for (const video of videos) {
    if (!validateUrl(video.url)) {
      return {
        valid: false,
        error:
          "Showreel links must be valid YouTube, Vimeo, or TikTok URLs.",
        code: "SHOWREEL_INVALID_URL",
      };
    }
  }

  return { valid: true };
}
