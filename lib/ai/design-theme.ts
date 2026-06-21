import type {
  StageTemplateCanvas,
  StageTemplateDocument,
  StageTemplatePalette,
  StageTemplateSection,
} from "@/lib/types/stage-template";

export function combineDesignHints(
  designInstructions?: string,
  refinePrompt?: string,
): string {
  return [designInstructions?.trim(), refinePrompt?.trim()].filter(Boolean).join("\n");
}

function isBrightTheme(hints: string): boolean {
  return /\b(bright|light|white|airy|pastel|sunny|daylight)\b/i.test(hints);
}

function isDarkTheme(hints: string): boolean {
  return /\b(dark|moody|noir|midnight|black)\b/i.test(hints);
}

/** Matches blue, common typos (blur), and navy/sky wording. */
export function prefersBlue(hints: string): boolean {
  return /\b(blue|blur|navy|azure|sky blue|royal blue|teal|cyan)\b/i.test(hints);
}

export function rejectsPink(hints: string): boolean {
  return /\b(no pink|not pink|avoid pink|without pink|don'?t like pink|hate pink|no magenta|not magenta|no fuchsia)\b/i.test(
    hints,
  );
}

export function wantsCircularImages(hints: string): boolean {
  return /\b(round|circular|circle|round images?|round photos?|circular images?|circular photos?|rounded photos?)\b/i.test(
    hints,
  );
}

export function wantsSoftRoundedImages(hints: string): boolean {
  return /\b(soft rounded|slightly rounded|rounded corners)\b/i.test(hints);
}

function bluePalette(bright: boolean): {
  palette: StageTemplatePalette;
  canvas: Pick<
    StageTemplateCanvas,
    "backgroundType" | "background" | "backgroundGradientTo"
  >;
} {
  return {
    palette: {
      primary: "#2563eb",
      secondary: bright ? "#059669" : "#0ea5e9",
      accent: "#f59e0b",
      text: bright ? "#0f172a" : "#f8fafc",
      muted: bright ? "#475569" : "#94a3b8",
      surface: bright ? "#ffffff" : "#1e293b",
      border: bright ? "#cbd5e1" : "#334155",
    },
    canvas: bright
      ? {
          backgroundType: "gradient",
          background: "#f0f9ff",
          backgroundGradientTo: "#e0f2fe",
        }
      : {
          backgroundType: "gradient",
          background: "#0f172a",
          backgroundGradientTo: "#1e3a5f",
        },
  };
}

export function imageStyleFromDesignHints(
  hints: string,
): NonNullable<StageTemplateDocument["assets"]> {
  if (wantsCircularImages(hints)) {
    return {
      avatarBorderRadius: "50%",
      galleryImageBorderRadius: "50%",
    };
  }

  if (wantsSoftRoundedImages(hints)) {
    return {
      avatarBorderRadius: "24px",
      galleryImageBorderRadius: "20px",
    };
  }

  if (/\b(square|sharp corners|no radius)\b/i.test(hints)) {
    return {
      avatarBorderRadius: "0",
      galleryImageBorderRadius: "0",
    };
  }

  return {
    avatarBorderRadius: "32px",
    galleryImageBorderRadius: "20px",
  };
}

export function applyDesignImageHints(
  template: StageTemplateDocument,
  hints: string,
): StageTemplateDocument {
  const defaults = imageStyleFromDesignHints(hints);
  const hasShapeHint =
    wantsCircularImages(hints) ||
    wantsSoftRoundedImages(hints) ||
    /\b(square|sharp corners|no radius)\b/i.test(hints);

  if (hasShapeHint) {
    return { ...template, assets: defaults };
  }

  return {
    ...template,
    assets: {
      avatarBorderRadius:
        template.assets?.avatarBorderRadius ?? defaults.avatarBorderRadius,
      galleryImageBorderRadius:
        template.assets?.galleryImageBorderRadius ??
        defaults.galleryImageBorderRadius,
    },
  };
}

function looksPinkStyle(value: string): boolean {
  return /#db2777|#d946ef|#ec4899|#f472b6|#e879f9|217,\s*70,\s*239|236,\s*72,\s*153|magenta|fuchsia|\bpink\b/i.test(
    value,
  );
}

function sanitizePinkFromStyle(
  style: StageTemplateSection["style"],
  palette: StageTemplatePalette,
): StageTemplateSection["style"] {
  let background = style.background;
  if (looksPinkStyle(background)) {
    background = `linear-gradient(180deg, ${palette.primary}18 0%, transparent 100%)`;
  }

  let borderColor = style.borderColor;
  if (looksPinkStyle(borderColor)) {
    borderColor = palette.border;
  }

  return { ...style, background, borderColor };
}

export function themeFromDesignHints(hints: string): {
  palette: StageTemplatePalette;
  canvas: Pick<
    StageTemplateCanvas,
    "backgroundType" | "background" | "backgroundGradientTo"
  >;
} | null {
  const wantsBlue = prefersBlue(hints) || rejectsPink(hints);

  if (isBrightTheme(hints)) {
    if (wantsBlue) {
      return bluePalette(true);
    }
    return {
      palette: {
        primary: "#0284c7",
        secondary: "#059669",
        accent: "#f59e0b",
        text: "#0f172a",
        muted: "#475569",
        surface: "#ffffff",
        border: "#cbd5e1",
      },
      canvas: {
        backgroundType: "gradient",
        background: "#f8fafc",
        backgroundGradientTo: "#e2e8f0",
      },
    };
  }

  if (wantsBlue) {
    return bluePalette(isDarkTheme(hints) ? false : true);
  }

  if (isDarkTheme(hints)) {
    return {
      palette: {
        primary: "#38bdf8",
        secondary: "#22d3ee",
        accent: "#fbbf24",
        text: "#fafafa",
        muted: "#a1a1aa",
        surface: "#18181b",
        border: "#3f3f46",
      },
      canvas: {
        backgroundType: "gradient",
        background: "#050505",
        backgroundGradientTo: "#111827",
      },
    };
  }

  return null;
}

function looksDarkSectionBackground(background: string): boolean {
  return /#0[0-5a-f]{4,5}|#1[0-8][0-9a-f]{3,4}|rgba?\(\s*(5|17|24|18)\b|#050505|#111827|#18181b|#0f172a/i.test(
    background,
  );
}

export function applyDesignThemeHints(
  template: StageTemplateDocument,
  hints: string,
): StageTemplateDocument {
  const theme = themeFromDesignHints(hints);
  const withImages = applyDesignImageHints(template, hints);
  const stripPink = prefersBlue(hints) || rejectsPink(hints);

  if (!theme) {
    if (!stripPink) {
      return withImages;
    }

    const palette = bluePalette(true).palette;
    return {
      ...withImages,
      palette: sanitizePalettePink(withImages.palette, palette),
      sections: withImages.sections.map((section) => ({
        ...section,
        style: sanitizePinkFromStyle(section.style, palette),
      })),
    };
  }

  const bright = isBrightTheme(hints);

  return {
    ...withImages,
    canvas: {
      ...withImages.canvas,
      ...theme.canvas,
    },
    palette: sanitizePalettePink(theme.palette, theme.palette),
    sections: withImages.sections.map((section) => ({
      ...section,
      style: sanitizePinkFromStyle(
        {
          ...section.style,
          background:
            bright && looksDarkSectionBackground(section.style.background)
              ? "rgba(255,255,255,0.92)"
              : section.style.background,
          borderColor: bright ? theme.palette.border : section.style.borderColor,
        },
        theme.palette,
      ),
    })),
  };
}

function sanitizePalettePink(
  palette: StageTemplatePalette,
  fallback: StageTemplatePalette,
): StageTemplatePalette {
  const primary = looksPinkHex(palette.primary) ? fallback.primary : palette.primary;
  const secondary = looksPinkHex(palette.secondary)
    ? fallback.secondary
    : palette.secondary;
  return { ...palette, primary, secondary };
}

function looksPinkHex(hex: string): boolean {
  return /#db2777|#d946ef|#ec4899|#f472b6|#e879f9/i.test(hex);
}

export function heroGradientForPalette(primary: string): string {
  return `linear-gradient(180deg, ${primary}20 0%, transparent 100%)`;
}
