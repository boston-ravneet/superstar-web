export const LANDING_TAGLINES = [
  "The ultimate stage for the best in your field. One premium link to showcase your entire brand.",
  "If you're a superstar in your field, this is your stage. One sleek link that puts your best work forward.",
  "Own your professional spotlight. Create one beautifully curated link that captures exactly why you're elite.",
] as const;

export function pickLandingTagline(): string {
  const index = Math.floor(Math.random() * LANDING_TAGLINES.length);
  return LANDING_TAGLINES[index] ?? LANDING_TAGLINES[0];
}
