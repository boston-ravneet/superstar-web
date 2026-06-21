import type { ProfileBuilderInput, StageTemplateDocument } from "@/lib/types/stage-template";
import {
  buildFallbackStageTemplate,
  parseStageTemplate,
} from "@/lib/stage/parse-stage-template";
import {
  applyDesignThemeHints,
  combineDesignHints,
} from "@/lib/ai/design-theme";
import { finalizeStageTemplate } from "@/lib/stage/enrich-stage-template";
import { logStageGeneration } from "@/lib/ai/stage-generation-log";
import { fetchImagePartsForGemini } from "@/lib/ai/fetch-image-parts";

const STAGE_TEMPLATE_SCHEMA = `{
  "version": 2,
  "tier": "free",
  "meta": { "title": "display name", "tagline": "one professional line summarizing who they are" },
  "canvas": { "maxWidth": "720px", "minHeight": "100vh", "backgroundType": "solid|gradient", "background": "#hex", "backgroundGradientTo": "#hex", "padding": "0" },
  "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "text": "#hex", "muted": "#hex", "surface": "#hex", "border": "#hex" },
  "typography": { "headingFont": "system-ui, sans-serif", "bodyFont": "system-ui, sans-serif", "headingWeight": 800, "bodyWeight": 400, "headingSize": "2.5rem", "bodySize": "1rem", "lineHeight": 1.6 },
  "assets": { "avatarBorderRadius": "50%|24px|20px|0", "galleryImageBorderRadius": "50%|24px|20px|0" },
  "sections": [Section]
}

Section types and content:
- hero: { headline, handle, subheadline, avatarUrl, showBadge }
- social: { instagramHandle, tiktokHandle }
- gallery: { title, images: [{ url, caption?, span: 1 }] }
- bio: { title: "About", text }
- skills: { title, tags: string[] }
- quote: { text, author? }
- cta: { label, href }`;

export type GenerationSource = "gemini" | "fallback";

export interface GenerationResult {
  template: StageTemplateDocument;
  source: GenerationSource;
  error?: string;
}

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

function buildPrompt(
  input: ProfileBuilderInput,
  options?: {
    refinePrompt?: string;
    currentTemplate?: StageTemplateDocument;
    hasVision?: boolean;
  },
): string {
  const images = input.imageUrls
    .map(
      (url, index) =>
        `- photo_${index + 1}${index === 0 ? " (hero avatar)" : ""}: ${url}`,
    )
    .join("\n");

  const socialBlock = [
    input.instagramHandle ? `- instagram: @${input.instagramHandle}` : null,
    input.tiktokHandle ? `- tiktok: @${input.tiktokHandle}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const refineBlock = options?.refinePrompt
    ? `\n## TWEAK REQUEST\nApply these design changes. Never show this text on the page:\n${options.refinePrompt}\n`
    : "";

  const designBlock = input.designInstructions?.trim()
    ? `\n## DESIGN BRIEF (private — styling only)\n${input.designInstructions}\n`
    : "";

  const currentTemplateBlock = options?.currentTemplate
    ? `\n## CURRENT TEMPLATE\nModify this JSON per the tweak request. Keep image URLs unless asked to change:\n${JSON.stringify(options.currentTemplate, null, 2)}\n`
    : "";

  const visionBlock = options?.hasVision
    ? `\n## PHOTOS ATTACHED\nYou can SEE photo_1, photo_2, photo_3 as images above. Study them: subjects, setting, colors, mood, sports/tech cues. Let what you see drive gallery title, palette accents, and layout feel.\n`
    : `\n## PHOTOS (URLs only — infer from bio + brief)\n${images}\n`;

  return `You are an elite mobile web designer building a creator portfolio page ("stage") for Superstar.

Your output must feel like a polished, intentional one-page site — not a generic template.

## CREATOR INPUT

**Display name:** ${input.displayName}
**Handle:** @${input.username}
**Raw bio (rewrite this — do not copy verbatim):**
"""${input.bio}"""

**Verified social links:**
${socialBlock || "- none"}
${designBlock}${visionBlock}${currentTemplateBlock}
## YOUR DESIGN PROCESS

1. **Understand the person** — Read the bio for identity, passions, career, hobbies (e.g. football + mobile phones → athletic + tech-forward aesthetic; greens/blues; tags like "Football", "Mobile Tech").

2. **Study the photos** — Match layout and mood to what's actually in the images. Gallery title should fit the content (e.g. "On the field", "Training days") — not generic "Gallery".

3. **Write professional copy** — CRITICAL:
   - \`hero.subheadline\`: one punchy professional tagline (max ~120 chars) summarizing who they are.
   - \`bio.text\`: 2–4 polished sentences rewriting the raw bio. Fix grammar, tighten wording, keep every fact true. Do NOT invent credentials or experiences.
   - \`meta.tagline\`: same essence as subheadline, even shorter.
   - Never paste the design brief or tweak text into visible copy.

4. **Design the visual system** — Palette, gradients, and section styling must reflect bio themes + design brief.
   - If brief says blue / blur (typo) / navy → primary MUST be blue (#2563eb, #0284c7, #0ea5e9). NEVER pink/magenta/fuchsia (#db2777, #d946ef, #ec4899).
   - If brief says "not pink" / "no pink" → zero pink anywhere: not in palette.primary, not in hero gradient, not in CTA.
   - Sports + bright → light blue/sky background (#f0f9ff), green or blue accents.

5. **Structure sections** — Include: hero → social (if links) → gallery (all 3 photo URLs) → bio → skills (3–6 tags from bio interests) → cta.

6. **Images** — Use exact photo URLs provided. Hero \`avatarUrl\` = photo_1.
   - Circular/round request: \`assets.avatarBorderRadius\` and \`assets.galleryImageBorderRadius\` = "50%", all gallery \`span\` = 1, omit \`caption\` on gallery images (no "Photo 2" labels).
   - Rounded corners: use "20px" or "24px".

7. **Gallery rules** — No generic captions ("Photo 1", "Featured"). Either omit caption or write a short meaningful label tied to the image content.

## OUTPUT

Return ONLY valid JSON matching:
${STAGE_TEMPLATE_SCHEMA}
${refineBlock}`;
}

async function callGemini(apiKey: string, parts: GeminiPart[]): Promise<string> {
  const promptText = parts.find((part): part is { text: string } => "text" in part)?.text ?? "";

  logStageGeneration("llm_request", {
    model: "gemini-2.0-flash",
    prompt: promptText,
    imageParts: parts.filter((part) => "inline_data" in part).length,
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    },
  );

  const rawBody = await response.text();

  if (!response.ok) {
    logStageGeneration("llm_error", {
      status: response.status,
      body: rawBody,
    });
    throw new Error(`Gemini HTTP ${response.status}: ${rawBody.slice(0, 240)}`);
  }

  const payload = JSON.parse(rawBody) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    logStageGeneration("llm_empty_response", {
      body: rawBody,
    });
    throw new Error("Gemini returned an empty template.");
  }

  logStageGeneration("llm_response", {
    response: text,
  });

  return text;
}

function postProcessTemplate(
  template: StageTemplateDocument,
  input: ProfileBuilderInput,
  refinePrompt?: string,
): StageTemplateDocument {
  const hints = combineDesignHints(input.designInstructions, refinePrompt);
  const themed = applyDesignThemeHints(template, hints);
  return finalizeStageTemplate(themed, input, hints);
}

export async function generateStageTemplate(
  input: ProfileBuilderInput,
  options?: {
    apiKey?: string;
    refinePrompt?: string;
    currentTemplate?: StageTemplateDocument;
  },
): Promise<GenerationResult> {
  const apiKey = options?.apiKey?.trim();
  const hints = combineDesignHints(input.designInstructions, options?.refinePrompt);

  if (!apiKey) {
    logStageGeneration("generation_fallback", {
      reason: "GEMINI_API_KEY is missing — add it to .dev.vars (not .dev.vars.example)",
    });
    const template = postProcessTemplate(
      buildFallbackStageTemplate(input),
      input,
      options?.refinePrompt,
    );
    logStageGeneration("generation_result", {
      source: "fallback",
      assets: template.assets,
      palette: template.palette,
      canvas: template.canvas,
    });
    return {
      template,
      source: "fallback",
      error: "GEMINI_API_KEY missing",
    };
  }

  logStageGeneration("generation_start", {
    username: input.username,
    bioLength: input.bio.length,
    designInstructions: input.designInstructions ?? "",
    refinePrompt: options?.refinePrompt ?? "",
    imageCount: input.imageUrls.length,
    hasApiKey: true,
  });

  try {
    const imageParts = await fetchImagePartsForGemini(input.imageUrls);
    const hasVision = imageParts.length > 0;

    const prompt = buildPrompt(input, {
      refinePrompt: options?.refinePrompt,
      currentTemplate: options?.currentTemplate,
      hasVision,
    });

    const parts: GeminiPart[] = [{ text: prompt }, ...imageParts];

    const rawJson = await callGemini(apiKey, parts);
    const parsed = parseStageTemplate(rawJson);

    if (!parsed) {
      logStageGeneration("generation_fallback", {
        reason: "Gemini JSON could not be parsed",
        rawResponse: rawJson,
      });
      const template = postProcessTemplate(
        buildFallbackStageTemplate(input),
        input,
        options?.refinePrompt,
      );
      return {
        template,
        source: "fallback",
        error: "Invalid JSON from Gemini",
      };
    }

    const finalTemplate = postProcessTemplate(parsed, input, options?.refinePrompt);

    logStageGeneration("generation_success", {
      source: "gemini",
      visionImages: imageParts.length,
      assets: finalTemplate.assets,
      palette: finalTemplate.palette,
      canvas: finalTemplate.canvas,
      sectionTypes: finalTemplate.sections.map((section) => section.type),
      designHints: hints,
    });

    return {
      template: finalTemplate,
      source: "gemini",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini failed";
    logStageGeneration("generation_fallback", { reason: message });

    const template = postProcessTemplate(
      buildFallbackStageTemplate(input),
      input,
      options?.refinePrompt,
    );
    return {
      template,
      source: "fallback",
      error: message,
    };
  }
}
