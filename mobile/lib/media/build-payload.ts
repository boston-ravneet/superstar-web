import {
  EMPTY_PORTFOLIO,
  PORTFOLIO_MAX,
  PORTFOLIO_MIN,
  PORTFOLIO_SLOT_COUNT,
  SHOWREEL_MAX,
  type PortfolioSlots,
} from "@/lib/media/constants";
import type { OnboardingState } from "@/lib/state/onboarding";

function isRemoteUrl(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

function resolveHeadshotPublicUrl(state: OnboardingState): string {
  const uploaded = state.headshotPublicUrl?.trim();
  if (uploaded) {
    return uploaded;
  }

  const localOrRemote = state.headshotUri?.trim();
  if (localOrRemote && isRemoteUrl(localOrRemote)) {
    return localOrRemote;
  }

  return "";
}

function resolvePortfolioSlots(state: OnboardingState): PortfolioSlots {
  if (state.portfolioPublicUrls.some(Boolean)) {
    return state.portfolioPublicUrls;
  }

  return state.portfolioUris;
}

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
  const headshotUrl = resolveHeadshotPublicUrl(state);
  const portfolioSlots = resolvePortfolioSlots(state);
  const portfolioImages = portfolioSlots
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url && isRemoteUrl(url)))
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
  const hasHeadshotSelected = Boolean(
    state.headshotUri?.trim() || state.headshotPublicUrl?.trim(),
  );
  if (!hasHeadshotSelected) {
    return "Add a profile headshot (square photo works best).";
  }

  const portfolioSlots = state.portfolioUris.some(Boolean)
    ? state.portfolioUris
    : state.portfolioPublicUrls;
  const portfolioCount = countFilledPortfolio(portfolioSlots);
  if (portfolioCount < PORTFOLIO_MIN) {
    return `Add at least ${PORTFOLIO_MIN} portfolio photos (up to ${PORTFOLIO_MAX}).`;
  }

  return null;
}

export function validateUploadedMediaState(state: OnboardingState): string | null {
  const headshotUrl = resolveHeadshotPublicUrl(state);
  if (!headshotUrl) {
    return "Your headshot did not upload. Go back and tap Create my page again.";
  }

  const portfolioCount = state.portfolioPublicUrls.filter(
    (url) => Boolean(url?.trim()) && isRemoteUrl(url!.trim()),
  ).length;

  if (portfolioCount < PORTFOLIO_MIN) {
    return `Add at least ${PORTFOLIO_MIN} portfolio photos (up to ${PORTFOLIO_MAX}).`;
  }

  return null;
}
