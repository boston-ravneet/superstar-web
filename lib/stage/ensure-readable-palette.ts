import type {
  StageTemplateCanvas,
  StageTemplateDocument,
  StageTemplatePalette,
} from "@/lib/types/stage-template";

function parseHexColor(value: string): [number, number, number] | null {
  const hex = value.trim();
  const match = hex.match(/^#([0-9a-f]{6})$/i);
  if (!match) {
    return null;
  }

  const raw = match[1];
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function canvasLuminance(canvas: StageTemplateCanvas): number {
  const primary = parseHexColor(canvas.background);
  if (!primary) {
    return 0.5;
  }

  if (canvas.backgroundType === "gradient" && canvas.backgroundGradientTo) {
    const secondary = parseHexColor(canvas.backgroundGradientTo);
    if (secondary) {
      return (
        (relativeLuminance(primary) + relativeLuminance(secondary)) / 2
      );
    }
  }

  return relativeLuminance(primary);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function readablePair(darkBackground: boolean): Pick<
  StageTemplatePalette,
  "text" | "muted" | "surface" | "border"
> {
  if (darkBackground) {
    return {
      text: "#f8fafc",
      muted: "#e2e8f0",
      surface: "rgba(15, 23, 42, 0.72)",
      border: "rgba(248, 250, 252, 0.22)",
    };
  }

  return {
    text: "#0f172a",
    muted: "#475569",
    surface: "rgba(255, 255, 255, 0.94)",
    border: "rgba(15, 23, 42, 0.12)",
  };
}

/** Ensures body/hero text meets readable contrast on the canvas background. */
export function ensureReadablePalette(
  template: StageTemplateDocument,
): StageTemplateDocument {
  const darkBackground = canvasLuminance(template.canvas) < 0.42;
  const readable = readablePair(darkBackground);
  const palette = { ...template.palette };

  const textLum = parseHexColor(palette.text)
    ? relativeLuminance(parseHexColor(palette.text)!)
    : darkBackground
      ? 0
      : 1;
  const mutedLum = parseHexColor(palette.muted)
    ? relativeLuminance(parseHexColor(palette.muted)!)
    : darkBackground
      ? 0
      : 1;
  const bgLum = canvasLuminance(template.canvas);

  if (contrastRatio(textLum, bgLum) < 4.5) {
    palette.text = readable.text;
  }

  if (contrastRatio(mutedLum, bgLum) < 3) {
    palette.muted = readable.muted;
  }

  if (darkBackground && parseHexColor(palette.surface)) {
    const surfaceLum = relativeLuminance(parseHexColor(palette.surface)!);
    if (surfaceLum > 0.35) {
      palette.surface = readable.surface;
    }
  }

  return {
    ...template,
    palette,
  };
}
