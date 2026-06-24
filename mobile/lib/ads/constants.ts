/** Video ads shown during free-tier profile build (before preview). */
export const BUILD_VIDEO_AD_COUNT = 3;

/** Simulated ad length in dev when AdMob is not wired yet. */
export const MOCK_VIDEO_AD_MS = __DEV__ ? 8_000 : 0;

export const BUILD_AI_STATUS_MESSAGES = [
  "Analyzing your photos with AI…",
  "Designing your layout and colors…",
  "Writing polished copy for your page…",
  "Applying your style and background…",
  "Finalizing your public stage…",
] as const;
