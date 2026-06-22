import type { StageTemplateTypography } from "@/lib/types/stage-template";

const GOOGLE_FAMILIES = new Set([
  "Inter",
  "Playfair Display",
  "Space Grotesk",
  "Cormorant Garamond",
  "DM Sans",
  "Oswald",
]);

function extractPrimaryFamily(fontStack: string): string | null {
  const first = fontStack.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");
  if (!first || first === "system-ui" || first === "sans-serif") {
    return null;
  }
  return first;
}

export function collectGoogleFontFamilies(
  typography: StageTemplateTypography,
): string[] {
  const families = new Set<string>();

  for (const stack of [typography.headingFont, typography.bodyFont]) {
    const family = extractPrimaryFamily(stack);
    if (family && GOOGLE_FAMILIES.has(family)) {
      families.add(family);
    }
  }

  return Array.from(families);
}

export function buildGoogleFontsHref(families: string[]): string | null {
  if (families.length === 0) {
    return null;
  }

  const query = families
    .map((family) => `family=${family.replace(/ /g, "+")}:wght@400;600;700;800`)
    .join("&");

  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
