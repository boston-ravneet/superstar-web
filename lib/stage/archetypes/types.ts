import type { StageTemplateDocument } from "@/lib/types/stage-template";

export type ArchetypeId =
  | "field-day"
  | "midnight-creator"
  | "studio-clean"
  | "gold-ledger";

export interface StageArchetype {
  id: ArchetypeId;
  name: string;
  description: string;
  /** Keywords used by the classifier (bio + design brief). */
  matchKeywords: RegExp;
  galleryTitle: string;
  skillsTitle: string;
  ctaLabel: string;
  /** Curated layout + visual system (content placeholders filled later). */
  base: StageTemplateDocument;
}

export interface CreatorClassification {
  archetypeId: ArchetypeId;
  archetypeName: string;
  vertical: string;
  mood: "bright" | "dark" | "luxury" | "minimal";
  confidence: number;
  matchReasons: string[];
}
