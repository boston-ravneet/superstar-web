import {
  combineDesignHints,
  prefersBlue,
  rejectsPink,
} from "@/lib/ai/design-theme";
import type {
  ProfileBuilderInput,
  StageTemplateDocument,
} from "@/lib/types/stage-template";

export interface TemplateValidationResult {
  valid: boolean;
  issues: string[];
}

function looksPinkHex(hex: string): boolean {
  return /#db2777|#d946ef|#ec4899|#f472b6|#e879f9/i.test(hex);
}

const REQUIRED_SECTIONS = ["hero", "bio"] as const;

export function validateStageTemplate(
  template: StageTemplateDocument,
  input: ProfileBuilderInput,
  refinePrompt?: string,
): TemplateValidationResult {
  const issues: string[] = [];
  const hints = combineDesignHints(input.designInstructions, refinePrompt);
  const visibleSections = template.sections.filter((section) => section.visible);

  for (const required of REQUIRED_SECTIONS) {
    if (!visibleSections.some((section) => section.type === required)) {
      issues.push(`Missing visible ${required} section`);
    }
  }

  const hasGallery = visibleSections.some(
    (section) => section.type === "gallery" || section.type === "highlights",
  );
  if (!hasGallery && input.imageUrls.some(Boolean)) {
    issues.push("Missing visible gallery or highlights section");
  }

  const hero = template.sections.find((section) => section.type === "hero");
  if (hero && !String(hero.content.headline ?? "").trim()) {
    issues.push("Hero missing headline");
  }

  if (
    (rejectsPink(hints) || prefersBlue(hints)) &&
    looksPinkHex(template.palette.primary)
  ) {
    issues.push("Primary palette is pink despite design brief");
  }

  if (template.sections.length < 4) {
    issues.push("Template has too few sections");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
