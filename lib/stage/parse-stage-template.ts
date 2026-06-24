import type {
  ProfileBuilderInput,
  StageSectionLayout,
  StageSectionStyle,
  StageTemplateCanvas,
  StageTemplateDocument,
  StageTemplatePalette,
  StageTemplateSection,
  StageTemplateTypography,
} from "@/lib/types/stage-template";
import { parseCanvasMotif } from "@/lib/stage/canvas-motifs";
import { DEFAULT_LAYOUT, DEFAULT_STYLE } from "@/lib/stage/template-defaults";
import { classifyCreator } from "@/lib/ai/classify-creator";
import { buildFromArchetype } from "@/lib/stage/fill-archetype";

function clampString(value: unknown, fallback: string, max = 500): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  return value.trim().slice(0, max);
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function parseLayout(raw: unknown): StageSectionLayout {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_LAYOUT;
  }

  const value = raw as Partial<StageSectionLayout>;
  return {
    display: value.display === "grid" ? "grid" : "flex",
    direction: value.direction === "row" ? "row" : "column",
    align: ["start", "center", "end", "stretch"].includes(value.align ?? "")
      ? (value.align as StageSectionLayout["align"])
      : "center",
    justify: ["start", "center", "end", "between", "around"].includes(
      value.justify ?? "",
    )
      ? (value.justify as StageSectionLayout["justify"])
      : "start",
    gap: clampString(value.gap, "16px", 32),
    padding: clampString(value.padding, "24px", 32),
    margin: clampString(value.margin, "0", 32),
    columns: clampNumber(value.columns, 1, 1, 4),
  };
}

function parseStyle(raw: unknown): StageSectionStyle {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_STYLE;
  }

  const value = raw as Partial<StageSectionStyle>;
  return {
    background: clampString(value.background, "transparent", 120),
    borderRadius: clampString(value.borderRadius, "0", 32),
    borderColor: clampString(value.borderColor, "transparent", 64),
    borderWidth: clampString(value.borderWidth, "0", 16),
    shadow: clampString(value.shadow, "none", 120),
    backdropBlur: clampString(value.backdropBlur, "0", 32),
  };
}

function parseSection(raw: unknown, index: number): StageTemplateSection | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Partial<StageTemplateSection>;
  const type = value.type;
  const allowed = [
    "hero",
    "bio",
    "gallery",
    "showreel",
    "highlights",
    "skills",
    "quote",
    "cta",
    "social",
  ];

  if (!type || !allowed.includes(type)) {
    return null;
  }

  return {
    id: clampString(value.id, `section-${index}`, 64),
    type: type as StageTemplateSection["type"],
    order: clampNumber(value.order, index, 0, 99),
    visible: value.visible !== false,
    layout: parseLayout(value.layout),
    style: parseStyle(value.style),
    content:
      value.content && typeof value.content === "object"
        ? (value.content as Record<string, unknown>)
        : {},
  };
}

function parsePalette(raw: unknown): StageTemplatePalette {
  const fallback: StageTemplatePalette = {
    primary: "#d946ef",
    secondary: "#22d3ee",
    accent: "#fbbf24",
    text: "#fafafa",
    muted: "#a1a1aa",
    surface: "#18181b",
    border: "#3f3f46",
  };

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const value = raw as Partial<StageTemplatePalette>;
  return {
    primary: clampString(value.primary, fallback.primary, 32),
    secondary: clampString(value.secondary, fallback.secondary, 32),
    accent: clampString(value.accent, fallback.accent, 32),
    text: clampString(value.text, fallback.text, 32),
    muted: clampString(value.muted, fallback.muted, 32),
    surface: clampString(value.surface, fallback.surface, 32),
    border: clampString(value.border, fallback.border, 32),
  };
}

function parseTypography(raw: unknown): StageTemplateTypography {
  const fallback: StageTemplateTypography = {
    headingFont: "system-ui, sans-serif",
    bodyFont: "system-ui, sans-serif",
    headingWeight: 800,
    bodyWeight: 400,
    headingSize: "2.5rem",
    bodySize: "1rem",
    lineHeight: 1.6,
  };

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const value = raw as Partial<StageTemplateTypography>;
  return {
    headingFont: clampString(value.headingFont, fallback.headingFont, 120),
    bodyFont: clampString(value.bodyFont, fallback.bodyFont, 120),
    headingWeight: clampNumber(value.headingWeight, fallback.headingWeight, 100, 900),
    bodyWeight: clampNumber(value.bodyWeight, fallback.bodyWeight, 100, 900),
    headingSize: clampString(value.headingSize, fallback.headingSize, 16),
    bodySize: clampString(value.bodySize, fallback.bodySize, 16),
    lineHeight: clampNumber(value.lineHeight, fallback.lineHeight, 1, 2.5),
  };
}

function parseAssets(raw: unknown): StageTemplateDocument["assets"] | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const value = raw as Partial<NonNullable<StageTemplateDocument["assets"]>>;
  const avatarBorderRadius = clampString(value.avatarBorderRadius, "", 16);
  const galleryImageBorderRadius = clampString(
    value.galleryImageBorderRadius,
    "",
    16,
  );

  if (!avatarBorderRadius && !galleryImageBorderRadius) {
    return undefined;
  }

  return {
    avatarBorderRadius: avatarBorderRadius || "32px",
    galleryImageBorderRadius: galleryImageBorderRadius || "20px",
  };
}

function parseCanvas(raw: unknown): StageTemplateCanvas {
  const fallback: StageTemplateCanvas = {
    maxWidth: "720px",
    minHeight: "100vh",
    backgroundType: "gradient",
    background: "#050505",
    backgroundGradientTo: "#18181b",
    padding: "0",
  };

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const value = raw as Partial<StageTemplateCanvas>;
  return {
    maxWidth: clampString(value.maxWidth, fallback.maxWidth, 32),
    minHeight: clampString(value.minHeight, fallback.minHeight, 32),
    backgroundType: value.backgroundType === "solid" ? "solid" : "gradient",
    background: clampString(value.background, fallback.background, 64),
    backgroundGradientTo: clampString(
      value.backgroundGradientTo,
      fallback.backgroundGradientTo ?? "#18181b",
      64,
    ),
    padding: clampString(value.padding, fallback.padding, 32),
    motif: parseCanvasMotif(value.motif),
  };
}

export function parseStageTemplate(json: string | null | undefined): StageTemplateDocument | null {
  if (!json?.trim()) {
    return null;
  }

  try {
    const raw = JSON.parse(json) as Partial<StageTemplateDocument>;
    if (raw.version !== 2 || !Array.isArray(raw.sections)) {
      return null;
    }

    const sections = raw.sections
      .map((section, index) => parseSection(section, index))
      .filter((section): section is StageTemplateSection => section !== null)
      .sort((a, b) => a.order - b.order);

    if (sections.length === 0) {
      return null;
    }

    return {
      version: 2,
      tier: "free",
      meta: {
        title: clampString(raw.meta?.title, "My Stage", 120),
        tagline: raw.meta?.tagline
          ? clampString(raw.meta.tagline, "", 200)
          : undefined,
      },
      canvas: parseCanvas(raw.canvas),
      palette: parsePalette(raw.palette),
      typography: parseTypography(raw.typography),
      assets: parseAssets(raw.assets),
      sections,
    };
  } catch {
    return null;
  }
}

export function serializeStageTemplate(template: StageTemplateDocument): string {
  return JSON.stringify(template);
}

export function buildFallbackStageTemplate(
  input: ProfileBuilderInput,
): StageTemplateDocument {
  const classification = classifyCreator(input);
  return buildFromArchetype(input, classification);
}
