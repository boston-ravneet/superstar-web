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
import { DEFAULT_LAYOUT, DEFAULT_STYLE } from "@/lib/stage/template-defaults";
import { finalizeStageTemplate } from "@/lib/stage/enrich-stage-template";
import { summarizeBioProfessionally, sanitizeSkillTags } from "@/lib/ai/bio-copy";
import {
  applyDesignThemeHints,
  combineDesignHints,
  heroGradientForPalette,
  imageStyleFromDesignHints,
} from "@/lib/ai/design-theme";

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

function paletteFromDesignInstructions(
  instructions: string | undefined,
): StageTemplatePalette {
  const theme = combineDesignHints(instructions);
  const fromHints = theme
    ? applyDesignThemeHints(
        {
          version: 2,
          tier: "free",
          meta: { title: "" },
          canvas: {
            maxWidth: "720px",
            minHeight: "100vh",
            backgroundType: "gradient",
            background: "#050505",
            backgroundGradientTo: "#111827",
            padding: "0",
          },
          palette: {
            primary: "#d946ef",
            secondary: "#22d3ee",
            accent: "#fbbf24",
            text: "#fafafa",
            muted: "#a1a1aa",
            surface: "#18181b",
            border: "#3f3f46",
          },
          typography: {
            headingFont: "system-ui, sans-serif",
            bodyFont: "system-ui, sans-serif",
            headingWeight: 800,
            bodyWeight: 400,
            headingSize: "2.5rem",
            bodySize: "1rem",
            lineHeight: 1.65,
          },
          sections: [],
        },
        theme,
      ).palette
    : null;

  if (fromHints) {
    return fromHints;
  }

  const text = (instructions ?? "").toLowerCase();

  if (text.includes("gold") || text.includes("luxury") || text.includes("elegant")) {
    return {
      primary: "#f59e0b",
      secondary: "#fde68a",
      accent: "#fbbf24",
      text: "#fafafa",
      muted: "#a1a1aa",
      surface: "#18181b",
      border: "#52525b",
    };
  }

  if (text.includes("cyan") || text.includes("blue") || text.includes("cool")) {
    return {
      primary: "#22d3ee",
      secondary: "#38bdf8",
      accent: "#818cf8",
      text: "#fafafa",
      muted: "#a1a1aa",
      surface: "#0f172a",
      border: "#334155",
    };
  }

  if (text.includes("minimal") || text.includes("clean") || text.includes("simple")) {
    return {
      primary: "#e4e4e7",
      secondary: "#a1a1aa",
      accent: "#fafafa",
      text: "#fafafa",
      muted: "#71717a",
      surface: "#18181b",
      border: "#3f3f46",
    };
  }

  return {
    primary: "#d946ef",
    secondary: "#22d3ee",
    accent: "#fbbf24",
    text: "#fafafa",
    muted: "#a1a1aa",
    surface: "#18181b",
    border: "#3f3f46",
  };
}

export function buildFallbackStageTemplate(
  input: ProfileBuilderInput,
): StageTemplateDocument {
  const avatarUrl = input.imageUrls[0] ?? "";
  const copy = summarizeBioProfessionally(input.bio, input.displayName);
  const themeHints = combineDesignHints(input.designInstructions, undefined);
  const circular = /\b(round|circular|circle)\b/i.test(themeHints);

  const galleryImages = input.imageUrls.map((url, index) => ({
    url,
    span: circular ? 1 : index === 0 ? 2 : 1,
  }));

  const skillCandidates = sanitizeSkillTags(
    copy.tags.length > 0
      ? copy.tags
      : input.bio
          .split(/[,.]/)
          .map((part) => part.trim())
          .filter((part) => part.length > 3 && part.length < 24),
  );

  const palette = paletteFromDesignInstructions(input.designInstructions);
  const brightCanvas = /\b(bright|light|white|airy|pastel|sunny|daylight)\b/i.test(
    themeHints,
  );

  const sections: StageTemplateSection[] = [
    {
      id: "hero",
      type: "hero",
      order: 0,
      visible: true,
      layout: { ...DEFAULT_LAYOUT, padding: "48px 24px 32px", gap: "12px" },
      style: {
        ...DEFAULT_STYLE,
        background: heroGradientForPalette(palette.primary),
      },
      content: {
        headline: input.displayName,
        handle: input.username,
        subheadline: copy.tagline,
        avatarUrl,
        showBadge: true,
      },
    },
  ];

  if (input.instagramHandle || input.tiktokHandle) {
    sections.push({
      id: "social",
      type: "social",
      order: 1,
      visible: true,
      layout: {
        ...DEFAULT_LAYOUT,
        direction: "row",
        gap: "12px",
        padding: "0 24px 16px",
      },
      style: DEFAULT_STYLE,
      content: {
        instagramHandle: input.instagramHandle ?? null,
        tiktokHandle: input.tiktokHandle ?? null,
      },
    });
  }

  sections.push(
    {
      id: "gallery",
      type: "gallery",
      order: 2,
      visible: galleryImages.length > 0,
      layout: {
        ...DEFAULT_LAYOUT,
        display: "grid",
        columns: 2,
        gap: "12px",
        padding: "0 24px 24px",
      },
      style: { ...DEFAULT_STYLE, borderRadius: "24px" },
      content: { title: "Gallery", images: galleryImages },
    },
    {
      id: "bio",
      type: "bio",
      order: 3,
      visible: Boolean(input.bio),
      layout: { ...DEFAULT_LAYOUT, align: "start", padding: "24px" },
      style: {
        ...DEFAULT_STYLE,
        background: brightCanvas
          ? "rgba(255,255,255,0.92)"
          : "rgba(24,24,27,0.85)",
        borderRadius: "24px",
        borderColor: brightCanvas
          ? "rgba(203,213,225,0.9)"
          : "rgba(63,63,70,0.8)",
        borderWidth: "1px",
      },
      content: { title: "About", text: copy.about },
    },
  );

  if (skillCandidates.length > 0) {
    sections.push({
      id: "skills",
      type: "skills",
      order: 4,
      visible: true,
      layout: {
        ...DEFAULT_LAYOUT,
        direction: "row",
        gap: "8px",
        padding: "0 24px 24px",
      },
      style: DEFAULT_STYLE,
      content: { title: "Passions", tags: skillCandidates },
    });
  }

  sections.push({
    id: "cta",
    type: "cta",
    order: 5,
    visible: true,
    layout: { ...DEFAULT_LAYOUT, padding: "24px 24px 48px" },
    style: {
      ...DEFAULT_STYLE,
      background: `linear-gradient(135deg, ${palette.primary}33, ${palette.secondary}26)`,
      borderRadius: "999px",
      borderColor: `${palette.primary}59`,
      borderWidth: "1px",
    },
    content: {
      label: "Get in touch",
      href: `mailto:hello@getsuperstar.info?subject=Booking%20@${input.username}`,
    },
  });

  return finalizeStageTemplate(
    {
      version: 2,
      tier: "free",
      meta: {
        title: input.displayName,
        tagline: copy.tagline,
      },
      canvas: {
        maxWidth: "720px",
        minHeight: "100vh",
        backgroundType: "gradient",
        background: brightCanvas ? "#f8fafc" : "#050505",
        backgroundGradientTo: brightCanvas ? "#e2e8f0" : "#111827",
        padding: "0",
      },
      palette,
      assets: imageStyleFromDesignHints(themeHints),
      typography: {
        headingFont: "system-ui, sans-serif",
        bodyFont: "system-ui, sans-serif",
        headingWeight: 800,
        bodyWeight: 400,
        headingSize: "2.5rem",
        bodySize: "1rem",
        lineHeight: 1.65,
      },
      sections,
    },
    input,
    themeHints,
  );
}
