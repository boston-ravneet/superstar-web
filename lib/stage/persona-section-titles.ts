import type { CreatorClassification } from "@/lib/stage/archetypes";

export interface PersonaSectionTitles {
  gallery: string;
  bio: string;
  skills: string;
}

const RESUME_GALLERY_TITLE =
  /\b(leadership|engagements?|professional summary|career highlights|work history|experience|qualifications|credentials|overview)\b/i;

const GENERIC_GALLERY_TITLE =
  /^(gallery|photos?|images?|media)$/i;

/** Titles that read like LinkedIn sections, not photo areas. */
export function isResumeStyleGalleryTitle(title: string): boolean {
  const normalized = title.trim();
  if (!normalized) {
    return true;
  }

  if (GENERIC_GALLERY_TITLE.test(normalized)) {
    return false;
  }

  return RESUME_GALLERY_TITLE.test(normalized);
}

function haystackFrom(input: { bio: string; designInstructions?: string }): string {
  return `${input.bio}\n${input.designInstructions ?? ""}`.toLowerCase();
}

function pickGalleryTitle(haystack: string, vertical: string): string {
  if (/\b(comedian|comedy|standup|stand-up|improv)\b/.test(haystack)) {
    return "On Stage";
  }
  if (/\b(actor|actress|film|movie|theatre|theater|tv)\b/.test(haystack)) {
    return "On Set";
  }
  if (/\b(painter|painting|artist|illustrator|sculptor|gallery art)\b/.test(haystack)) {
    return "The Studio";
  }
  if (/\b(doctor|physician|surgeon|nurse|medical|clinic|hospital|dentist)\b/.test(haystack)) {
    return "In Practice";
  }
  if (/\b(musician|singer|rapper|band|dj|producer)\b/.test(haystack)) {
    return "On Stage";
  }
  if (/\b(football|soccer|sport|athlete|basketball|training)\b/.test(haystack)) {
    return "In Action";
  }
  if (/\b(chef|cook|kitchen|restaurant|food)\b/.test(haystack)) {
    return "In the Kitchen";
  }
  if (/\b(fashion|model|runway|style)\b/.test(haystack)) {
    return "The Lookbook";
  }
  if (/\b(sales|marketing|business|manager|executive|account lead)\b/.test(haystack)) {
    return "At Work";
  }
  if (/\b(student|school|grade|campus|vcms)\b/.test(haystack)) {
    return "Life & Moments";
  }
  if (/\b(creator|influencer|content|stream|gaming|gamer)\b/.test(haystack)) {
    return "Behind the Content";
  }

  switch (vertical) {
    case "musician":
      return "On Stage";
    case "athlete":
      return "In Action";
    case "creator":
      return "Highlights";
    case "fashion":
      return "The Lookbook";
    case "student":
      return "Life & Moments";
    default:
      return "Moments";
  }
}

function pickBioTitle(haystack: string, vertical: string): string {
  if (/\b(doctor|physician|surgeon|medical)\b/.test(haystack)) {
    return "Background";
  }
  if (/\b(comedian|actor|actress|musician|artist|painter)\b/.test(haystack)) {
    return "The Story";
  }
  if (/\b(chef|restaurant)\b/.test(haystack)) {
    return "About the Chef";
  }
  return vertical === "student" ? "About Me" : "About";
}

function pickSkillsTitle(haystack: string, vertical: string): string {
  if (/\b(doctor|physician|surgeon|medical|dentist)\b/.test(haystack)) {
    return "Specialties";
  }
  if (/\b(comedian|comedy)\b/.test(haystack)) {
    return "Topics & Style";
  }
  if (/\b(painter|artist|illustrator)\b/.test(haystack)) {
    return "Mediums & Focus";
  }
  if (/\b(actor|actress|film)\b/.test(haystack)) {
    return "The Craft";
  }
  if (/\b(musician|singer|rapper|band)\b/.test(haystack)) {
    return "Sound & Style";
  }
  if (/\b(sales|marketing|business|executive)\b/.test(haystack)) {
    return "Core Strengths";
  }
  if (vertical === "athlete") {
    return "Passions";
  }
  return "Expertise";
}

export function suggestPersonaSectionTitles(
  classification: CreatorClassification,
  input: { bio: string; designInstructions?: string },
): PersonaSectionTitles {
  const haystack = haystackFrom(input);

  return {
    gallery: pickGalleryTitle(haystack, classification.vertical),
    bio: pickBioTitle(haystack, classification.vertical),
    skills: pickSkillsTitle(haystack, classification.vertical),
  };
}

export function resolveGalleryTitle(
  title: string | undefined,
  classification: CreatorClassification,
  input: { bio: string; designInstructions?: string },
): string {
  const trimmed = title?.trim() ?? "";
  if (!trimmed || isResumeStyleGalleryTitle(trimmed)) {
    return suggestPersonaSectionTitles(classification, input).gallery;
  }
  return trimmed;
}

export function resolveBioTitle(
  title: string | undefined,
  classification: CreatorClassification,
  input: { bio: string; designInstructions?: string },
): string {
  return title?.trim() || suggestPersonaSectionTitles(classification, input).bio;
}

export function resolveSkillsTitle(
  title: string | undefined,
  classification: CreatorClassification,
  input: { bio: string; designInstructions?: string },
): string {
  return title?.trim() || suggestPersonaSectionTitles(classification, input).skills;
}

export function sanitizeGalleryTitleForDisplay(title: string): string {
  const trimmed = title.trim();
  if (!trimmed || isResumeStyleGalleryTitle(trimmed)) {
    if (/\b(sales|marketing|business|leadership|engagement)\b/i.test(trimmed)) {
      return "At Work";
    }
    return "Photos";
  }
  return trimmed;
}
