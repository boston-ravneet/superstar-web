import mobileAds from "react-native-google-mobile-ads";

let initPromise: Promise<void> | null = null;

export async function initializeAds(): Promise<void> {
  await ensureAdsInitialized();
}

export function ensureAdsInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = mobileAds()
      .initialize()
      .then(() => undefined);
  }

  return initPromise;
}
