/** Bump when Terms & Conditions change; users must re-accept. */
export const CURRENT_TERMS_VERSION = "2026-06-24";

export function hasAcceptedCurrentTerms(input: {
  termsAcceptedAt: string | null;
  termsVersion: string | null;
}): boolean {
  return (
    Boolean(input.termsAcceptedAt?.trim()) &&
    input.termsVersion === CURRENT_TERMS_VERSION
  );
}
