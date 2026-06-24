import { MOCK_VIDEO_AD_MS } from "@/lib/ads/constants";

export type VideoAdOutcome = "completed" | "unavailable" | "dismissed";

export interface VideoAdContext {
  slot: number;
  total: number;
}

export interface VideoAdProvider {
  showVideoAd(context: VideoAdContext): Promise<VideoAdOutcome>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Placeholder until AdMob / AppLovin is integrated.
 * Swap `getVideoAdProvider()` to return the real SDK implementation.
 */
export const mockVideoAdProvider: VideoAdProvider = {
  async showVideoAd(context) {
    const duration = MOCK_VIDEO_AD_MS || 15_000;
    await delay(duration);
    return "completed";
  },
};

let provider: VideoAdProvider = mockVideoAdProvider;

export function getVideoAdProvider(): VideoAdProvider {
  return provider;
}

/** Test hook — call from app init once real ads are configured. */
export function setVideoAdProvider(next: VideoAdProvider): void {
  provider = next;
}
