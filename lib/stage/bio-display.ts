import type {
  ProfileBuilderInput,
  StageTemplateDocument,
} from "@/lib/types/stage-template";
import { summarizeBioProfessionally, isSameBioText } from "@/lib/ai/bio-copy";

export type BioDisplayMode = "polished" | "original";

export function extractPolishedCopyFromTemplate(
  template: StageTemplateDocument,
): { polishedBio: string; polishedTagline: string } {
  const hero = template.sections.find((section) => section.type === "hero");
  const bio = template.sections.find((section) => section.type === "bio");

  return {
    polishedTagline:
      String(hero?.content.subheadline ?? template.meta.tagline ?? "").trim(),
    polishedBio: String(bio?.content.text ?? "").trim(),
  };
}

export function ensurePolishedCopy(
  input: ProfileBuilderInput,
  template: StageTemplateDocument,
): ProfileBuilderInput {
  if (input.polishedBio?.trim() && input.polishedTagline?.trim()) {
    return input;
  }

  const extracted = extractPolishedCopyFromTemplate(template);
  return {
    ...input,
    polishedBio: input.polishedBio?.trim() || extracted.polishedBio,
    polishedTagline: input.polishedTagline?.trim() || extracted.polishedTagline,
  };
}

export function applyBioDisplayMode(
  template: StageTemplateDocument,
  input: ProfileBuilderInput,
  mode: BioDisplayMode,
): StageTemplateDocument {
  const originalBio = input.bio.trim();
  const polishedBio = input.polishedBio?.trim() ?? "";
  const polishedTagline = input.polishedTagline?.trim() ?? "";
  const fallback = summarizeBioProfessionally(originalBio, input.displayName);

  const effectivePolishedBio =
    polishedBio && !isSameBioText(polishedBio, originalBio)
      ? polishedBio
      : fallback.about;

  const effectivePolishedTagline =
    polishedTagline && !isSameBioText(polishedTagline, originalBio)
      ? polishedTagline
      : fallback.tagline;

  const bioText = mode === "original" ? originalBio : effectivePolishedBio;
  const tagline = mode === "original" ? fallback.tagline : effectivePolishedTagline;

  return {
    ...template,
    meta: {
      ...template.meta,
      tagline,
    },
    sections: template.sections.map((section) => {
      if (section.type === "hero") {
        return {
          ...section,
          content: {
            ...section.content,
            subheadline: tagline,
          },
        };
      }

      if (section.type === "bio") {
        return {
          ...section,
          content: {
            ...section.content,
            text: bioText,
          },
        };
      }

      return section;
    }),
  };
}

export function resolveBioDisplayMode(
  input: ProfileBuilderInput | null,
): BioDisplayMode {
  return input?.bioDisplayMode === "original" ? "original" : "polished";
}
