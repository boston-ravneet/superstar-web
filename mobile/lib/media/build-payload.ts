import {
  EMPTY_PORTFOLIO,
  PORTFOLIO_MAX,
  PORTFOLIO_MIN,
  PORTFOLIO_SLOT_COUNT,
  SHOWREEL_MAX,
  type PortfolioSlots,
} from "@/lib/media/constants";
import type { OnboardingState } from "@/lib/state/onboarding";

export interface BuilderMediaPayload {
  headshotUrl: string;
  showreelVideos: Array<{ url: string; title?: string }>;
  portfolioImages: Array<{ url: string; caption?: string }>;
}

function fillPortfolioSlots(urls: string[]): PortfolioSlots {
  const slots = [...EMPTY_PORTFOLIO];
  for (let index = 0; index < PORTFOLIO_SLOT_COUNT; index += 1) {
    slots[index] = urls[index] ?? null;
  }
  return slots;
}

export function mediaStateFromBuilderInput(input: {
  imageUrls: string[];
  media?: BuilderMediaPayload;
}): Pick<
  OnboardingState,
  | "headshotUri"
  | "headshotPublicUrl"
  | "showreelUrls"
  | "portfolioUris"
  | "portfolioPublicUrls"
> {
  if (input.media?.headshotUrl) {
    const portfolioUrls = input.media.portfolioImages
      .map((entry) => entry.url?.trim())
      .filter(Boolean);
    const filled = fillPortfolioSlots(portfolioUrls);
    const showreelUrls: [string, string] = [
      input.media.showreelVideos[0]?.url ?? "",
      input.media.showreelVideos[1]?.url ?? "",
    ];

    return {
      headshotUri: input.media.headshotUrl,
      headshotPublicUrl: input.media.headshotUrl,
      showreelUrls,
      portfolioUris: filled,
      portfolioPublicUrls: filled,
    };
  }

  const urls = input.imageUrls.filter(Boolean);
  const headshot = urls[0] ?? null;
  const portfolio = urls.slice(1);
  while (portfolio.length < PORTFOLIO_MIN && portfolio.length > 0) {
    portfolio.push(portfolio[portfolio.length - 1]);
  }

  const filled = fillPortfolioSlots(portfolio.slice(0, PORTFOLIO_MAX));
  return {
    headshotUri: headshot,
    headshotPublicUrl: headshot,
    showreelUrls: ["", ""],
    portfolioUris: filled,
    portfolioPublicUrls: filled,
  };
}

export function buildSubmitMedia(state: OnboardingState): {
  media: BuilderMediaPayload;
  imageUrls: string[];
} {
  const headshotUrl = state.headshotPublicUrl?.trim() ?? "";
  const portfolioImages = state.portfolioPublicUrls
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ url }));
  const showreelVideos = state.showreelUrls
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, SHOWREEL_MAX)
    .map((url) => ({ url }));

  const media: BuilderMediaPayload = {
    headshotUrl,
    showreelVideos,
    portfolioImages,
  };

  return {
    media,
    imageUrls: [headshotUrl, ...portfolioImages.map((entry) => entry.url)].filter(
      Boolean,
    ),
  };
}

export function countFilledPortfolio(slots: PortfolioSlots): number {
  return slots.filter(Boolean).length;
}

export function validateMediaState(state: OnboardingState): string | null {
  const hasHeadshot = Boolean(state.headshotUri || state.headshotPublicUrl);
  if (!hasHeadshot) {
    return "Upload a profile headshot (square photo).";
  }

  const portfolioSlots = state.portfolioPublicUrls.some(Boolean)
    ? state.portfolioPublicUrls
    : state.portfolioUris;
  const portfolioCount = countFilledPortfolio(portfolioSlots);
  if (portfolioCount < PORTFOLIO_MIN) {
    return `Add at least ${PORTFOLIO_MIN} portfolio photos (up to ${PORTFOLIO_MAX}).`;
  }

  return null;
}
