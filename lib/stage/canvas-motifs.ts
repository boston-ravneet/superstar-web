import {
  combineDesignHints,
  wantsSkyEarthTheme,
} from "@/lib/ai/design-theme";
import type {
  ProfileBuilderInput,
  StageTemplateCanvas,
  StageTemplateDocument,
  StageTemplatePalette,
} from "@/lib/types/stage-template";
import type { CreatorClassification } from "@/lib/stage/archetypes/types";

/** CSS-only background decoration presets the renderer knows how to paint. */
export type CanvasMotifId =
  | "none"
  | "film-grain"
  | "spotlight"
  | "sky-earth"
  | "soft-bokeh"
  | "stage-lights"
  | "tech-grid"
  | "sport-stripe"
  | "warm-glow";

export const CANVAS_MOTIF_IDS: CanvasMotifId[] = [
  "none",
  "film-grain",
  "spotlight",
  "sky-earth",
  "soft-bokeh",
  "stage-lights",
  "tech-grid",
  "sport-stripe",
  "warm-glow",
];

function isCanvasMotifId(value: string): value is CanvasMotifId {
  return CANVAS_MOTIF_IDS.includes(value as CanvasMotifId);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(255,255,255,${alpha})`;
  }
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function filmGrainTexture(): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function cloudLayer(color = "255,255,255"): string {
  return [
    `radial-gradient(ellipse 120px 48px at 18% 12%, rgba(${color},0.92) 0%, transparent 70%)`,
    `radial-gradient(ellipse 96px 40px at 32% 8%, rgba(${color},0.88) 0%, transparent 68%)`,
    `radial-gradient(ellipse 140px 52px at 58% 14%, rgba(${color},0.9) 0%, transparent 72%)`,
    `radial-gradient(ellipse 88px 36px at 78% 10%, rgba(${color},0.85) 0%, transparent 65%)`,
    `radial-gradient(ellipse 110px 44px at 90% 18%, rgba(${color},0.8) 0%, transparent 68%)`,
  ].join(", ");
}

function grassLayer(green: string): string {
  return [
    `linear-gradient(0deg, ${rgba(green, 0.35)} 0%, ${rgba(green, 0.12)} 8%, transparent 22%)`,
    `repeating-linear-gradient(105deg, transparent 0 14px, ${rgba(green, 0.08)} 14px 15px)`,
    `repeating-linear-gradient(75deg, transparent 0 18px, ${rgba(green, 0.06)} 18px 19px)`,
  ].join(", ");
}

export interface CanvasBackgroundLayers {
  base: string;
  overlay?: string;
  overlayBlendMode?: string;
  overlayOpacity?: number;
  grain?: string;
  grainOpacity?: number;
  grainBlendMode?: string;
}

export function buildCanvasBackgroundLayers(
  canvas: StageTemplateCanvas,
  palette: StageTemplatePalette,
  motif: CanvasMotifId = "none",
): CanvasBackgroundLayers {
  const base =
    canvas.backgroundType === "gradient"
      ? `linear-gradient(180deg, ${canvas.background} 0%, ${canvas.backgroundGradientTo ?? canvas.background} 100%)`
      : canvas.background;

  if (motif === "none") {
    return { base };
  }

  const primary = palette.primary;
  const secondary = palette.secondary;
  const accent = palette.accent;

  switch (motif) {
    case "film-grain":
      return {
        base,
        overlay: [
          `radial-gradient(ellipse 80% 60% at 50% 0%, ${rgba(primary, 0.18)} 0%, transparent 55%)`,
          `linear-gradient(180deg, ${rgba("#000000", 0.08)} 0%, transparent 40%, ${rgba("#000000", 0.12)} 100%)`,
        ].join(", "),
        grain: filmGrainTexture(),
        grainOpacity: 0.22,
        grainBlendMode: "overlay",
      };

    case "spotlight":
      return {
        base,
        overlay: [
          `radial-gradient(ellipse 70% 55% at 50% -5%, ${rgba(accent, 0.35)} 0%, transparent 60%)`,
          `radial-gradient(ellipse 90% 70% at 50% 100%, ${rgba("#000000", 0.25)} 0%, transparent 55%)`,
          `linear-gradient(180deg, transparent 0%, ${rgba(primary, 0.06)} 100%)`,
        ].join(", "),
        overlayBlendMode: "normal",
      };

    case "sky-earth":
      return {
        base,
        overlay: [cloudLayer(), grassLayer(secondary)].join(", "),
        overlayBlendMode: "normal",
      };

    case "soft-bokeh":
      return {
        base,
        overlay: [
          `radial-gradient(circle 80px at 12% 20%, ${rgba(primary, 0.2)} 0%, transparent 70%)`,
          `radial-gradient(circle 64px at 82% 16%, ${rgba(secondary, 0.18)} 0%, transparent 68%)`,
          `radial-gradient(circle 96px at 70% 78%, ${rgba(accent, 0.14)} 0%, transparent 72%)`,
          `radial-gradient(circle 72px at 24% 72%, ${rgba(primary, 0.12)} 0%, transparent 65%)`,
        ].join(", "),
        overlayBlendMode: "normal",
      };

    case "stage-lights":
      return {
        base,
        overlay: [
          `conic-gradient(from 200deg at 50% -10%, ${rgba(primary, 0.28)}, transparent 35%, ${rgba(secondary, 0.22)}, transparent 65%, ${rgba(accent, 0.2)}, transparent)`,
          `linear-gradient(180deg, ${rgba("#000000", 0.15)} 0%, transparent 35%)`,
        ].join(", "),
        overlayBlendMode: "screen",
        overlayOpacity: 0.85,
      };

    case "tech-grid":
      return {
        base,
        overlay: [
          `linear-gradient(${rgba(primary, 0.08)} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${rgba(primary, 0.08)} 1px, transparent 1px)`,
          `radial-gradient(ellipse 60% 40% at 50% 0%, ${rgba(primary, 0.12)} 0%, transparent 70%)`,
        ].join(", "),
        overlayBlendMode: "normal",
      };

    case "sport-stripe":
      return {
        base,
        overlay: [
          `repeating-linear-gradient(-18deg, transparent 0 28px, ${rgba(primary, 0.07)} 28px 56px)`,
          `linear-gradient(90deg, ${rgba(secondary, 0.08)} 0%, transparent 35%, ${rgba(primary, 0.06)} 100%)`,
        ].join(", "),
        overlayBlendMode: "normal",
      };

    case "warm-glow":
      return {
        base,
        overlay: [
          `radial-gradient(ellipse 90% 50% at 50% -15%, ${rgba(accent, 0.2)} 0%, transparent 60%)`,
          `radial-gradient(circle at 100% 100%, ${rgba(secondary, 0.1)} 0%, transparent 45%)`,
        ].join(", "),
        overlayBlendMode: "normal",
      };

    default:
      return { base };
  }
}

/** Tech grid needs background-size on overlay — returned separately for renderer. */
export function motifOverlayStyle(motif: CanvasMotifId): {
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
} {
  if (motif === "tech-grid") {
    return {
      backgroundSize: "32px 32px, 32px 32px, 100% 100%",
      backgroundRepeat: "repeat, repeat, no-repeat",
    };
  }
  return {};
}

export function inferCanvasMotif(
  input: ProfileBuilderInput,
  classification: CreatorClassification,
  hints = combineDesignHints(input.designInstructions),
): CanvasMotifId {
  const haystack = `${input.bio}\n${hints}`;
  const { vertical, mood } = classification;

  if (wantsSkyEarthTheme(hints)) {
    return "sky-earth";
  }

  if (
    /\b(actor|actress|acting|film|movie|cinema|theater|theatre|hollywood|drama|screen)\b/i.test(
      haystack,
    )
  ) {
    return mood === "dark" || mood === "luxury" ? "film-grain" : "spotlight";
  }

  if (
    /\b(comedian|comedy|stand-?up|humor|humour|host|mc\b|presenter)\b/i.test(
      haystack,
    )
  ) {
    return "spotlight";
  }

  if (
    /\b(music|singer|musician|rapper|dj\b|band|concert|performer|dancer)\b/i.test(
      haystack,
    )
  ) {
    return mood === "dark" ? "stage-lights" : "soft-bokeh";
  }

  if (
    /\b(nature|outdoor|hiking|garden|environment|earth|sky|forest|wildlife)\b/i.test(
      haystack,
    )
  ) {
    return "sky-earth";
  }

  if (
    /\b(football|soccer|sport|athlete|basketball|training|fitness|coach)\b/i.test(
      haystack,
    )
  ) {
    return "sport-stripe";
  }

  if (
    /\b(tech|developer|engineer|coding|software|gaming|gamer|mobile phone)\b/i.test(
      haystack,
    )
  ) {
    return "tech-grid";
  }

  if (
    /\b(fashion|style|model|portrait|photography|beauty|luxury)\b/i.test(
      haystack,
    )
  ) {
    return "soft-bokeh";
  }

  if (vertical === "athlete") {
    return "sport-stripe";
  }
  if (vertical === "musician") {
    return mood === "dark" ? "stage-lights" : "soft-bokeh";
  }
  if (vertical === "tech") {
    return "tech-grid";
  }
  if (vertical === "fashion") {
    return "soft-bokeh";
  }

  if (mood === "dark") {
    return "film-grain";
  }
  if (mood === "luxury") {
    return "soft-bokeh";
  }

  return "warm-glow";
}

export function resolveCanvasMotif(
  template: StageTemplateDocument,
  input: ProfileBuilderInput,
  classification: CreatorClassification,
  hints = combineDesignHints(input.designInstructions),
): CanvasMotifId {
  const fromTemplate = template.canvas.motif?.trim();
  if (fromTemplate && isCanvasMotifId(fromTemplate)) {
    return fromTemplate;
  }
  return inferCanvasMotif(input, classification, hints);
}

export function applyCanvasMotif(
  template: StageTemplateDocument,
  input: ProfileBuilderInput,
  classification: CreatorClassification,
  hints = combineDesignHints(input.designInstructions),
): StageTemplateDocument {
  const motif = resolveCanvasMotif(template, input, classification, hints);

  return {
    ...template,
    canvas: {
      ...template.canvas,
      motif,
    },
  };
}

export function parseCanvasMotif(raw: unknown): CanvasMotifId | undefined {
  if (typeof raw !== "string" || !raw.trim()) {
    return undefined;
  }
  const normalized = raw.trim() as CanvasMotifId;
  return isCanvasMotifId(normalized) ? normalized : undefined;
}
