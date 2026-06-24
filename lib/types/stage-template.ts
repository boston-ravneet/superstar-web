export type PublishStatus = "draft" | "generating" | "preview" | "published";

export type StageSectionType =
  | "hero"
  | "bio"
  | "gallery"
  | "showreel"
  | "highlights"
  | "skills"
  | "quote"
  | "cta"
  | "social";

export interface StageTemplatePalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
}

export interface StageTemplateTypography {
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  bodyWeight: number;
  headingSize: string;
  bodySize: string;
  lineHeight: number;
}

export interface StageTemplateCanvas {
  maxWidth: string;
  minHeight: string;
  backgroundType: "solid" | "gradient";
  background: string;
  backgroundGradientTo?: string;
  padding: string;
  /** CSS-only decorative overlay preset (clouds, film grain, spotlight, etc.). */
  motif?: import("@/lib/stage/canvas-motifs").CanvasMotifId;
}

export interface StageSectionLayout {
  display: "flex" | "grid";
  direction: "row" | "column";
  align: "start" | "center" | "end" | "stretch";
  justify: "start" | "center" | "end" | "between" | "around";
  gap: string;
  padding: string;
  margin: string;
  columns: number;
}

export interface StageSectionStyle {
  background: string;
  borderRadius: string;
  borderColor: string;
  borderWidth: string;
  shadow: string;
  backdropBlur: string;
}

export interface StageTemplateSection {
  id: string;
  type: StageSectionType;
  order: number;
  visible: boolean;
  layout: StageSectionLayout;
  style: StageSectionStyle;
  content: Record<string, unknown>;
}

export interface StageTemplateAssets {
  avatarBorderRadius: string;
  galleryImageBorderRadius: string;
}

export interface StageTemplateDocument {
  version: 2;
  tier: "free";
  meta: {
    title: string;
    tagline?: string;
  };
  canvas: StageTemplateCanvas;
  palette: StageTemplatePalette;
  typography: StageTemplateTypography;
  assets?: StageTemplateAssets;
  sections: StageTemplateSection[];
}

export interface ProfileBuilderInput {
  bio: string;
  /** Private LLM styling notes — never shown on the public page. */
  designInstructions?: string;
  imageUrls: string[];
  /** Structured media — headshot, showreel links, portfolio gallery. */
  media?: import("@/lib/stage/builder-media").BuilderMediaInput;
  displayName: string;
  username: string;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  /** User-selected layout style; overrides auto-classification when set. */
  preferredArchetypeId?: import("@/lib/stage/archetypes/types").ArchetypeId;
  /** Which bio copy is shown on the stage page. */
  bioDisplayMode?: "polished" | "original";
  /** Saved social handles (optional Verify in a later phase). */
  socialAccounts?: import("@/lib/stage/social-accounts").SocialAccount[];
  /** AI-polished about text (saved after generation). */
  polishedBio?: string;
  /** AI-polished hero tagline (saved after generation). */
  polishedTagline?: string;
}

export interface BuilderBioSourcePayload {
  profileId: string;
  useOriginalBio: boolean;
}

export interface BuilderSubmitPayload {
  profileId: string;
  bio: string;
  designInstructions?: string;
  /** @deprecated use designInstructions */
  extraDetails?: string;
  imageUrls: string[];
  preferredArchetypeId?: import("@/lib/stage/archetypes/types").ArchetypeId;
  socialAccounts?: import("@/lib/stage/social-accounts").SocialAccount[];
  media?: import("@/lib/stage/builder-media").BuilderMediaInput;
}

export interface BuilderRefinePayload {
  profileId: string;
  prompt: string;
}

export interface BuilderStatusResponse {
  profileId: string;
  username: string;
  publishStatus: PublishStatus;
  generationError: string | null;
  template: StageTemplateDocument | null;
  previewUrl: string | null;
  publicUrl: string | null;
}
