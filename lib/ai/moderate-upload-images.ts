import { fetchImagePartsForGemini } from "@/lib/ai/fetch-image-parts";
import { logStageGeneration } from "@/lib/ai/stage-generation-log";

const GEMINI_MODEL = "gemini-2.5-flash";
const MODERATION_MAX_IMAGES = 7;

export class ContentModerationError extends Error {
  readonly code = "CONTENT_NOT_ALLOWED";

  constructor(message: string) {
    super(message);
    this.name = "ContentModerationError";
  }
}

export interface ImageModerationResult {
  allowed: boolean;
  reason?: string;
}

const MODERATION_PROMPT = `You are a content safety moderator for Superstar, a public profile page builder.

Review every attached image. Only reject clear policy violations. Normal profile photos should pass.

REJECT only if an image clearly contains or promotes:
- Illegal activity or unlawful content
- Sexually explicit or pornographic material (not normal clothed portraits)
- Graphic violence, gore, or cruelty
- Hate symbols, extremist propaganda, or harassment targeting protected groups
- Content sexualizing minors or suggesting child exploitation
- Non-consensual intimate imagery
- Malware, phishing, or scam imagery

ALLOW all normal profile content, including:
- Headshots and selfies (any age)
- School portraits, team photos, and sports action shots
- Family photos and travel photos in everyday settings
- Portfolio shots for creators, musicians, athletes, and students

Photos of minors are allowed when they are normal, fully clothed profile or activity photos — only reject if the image is clearly exploitative or sexualized.

When unsure, allow.

Return ONLY valid JSON:
{"allowed": true}
or
{"allowed": false, "reason": "short user-facing explanation without graphic detail"}`;

function parseModerationResponse(raw: string): ImageModerationResult {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logStageGeneration("moderation_parse_failed", { raw: trimmed.slice(0, 300) });
    return { allowed: true };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      allowed?: boolean | string;
      reason?: string;
    };

    const allowedValue = parsed.allowed;
    if (allowedValue === true || allowedValue === "true") {
      return { allowed: true };
    }

    if (allowedValue === false || allowedValue === "false") {
      const reason =
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim().slice(0, 240)
          : "One or more photos violate our content policy.";
      return { allowed: false, reason };
    }

    return { allowed: true };
  } catch {
    logStageGeneration("moderation_parse_error", { raw: trimmed.slice(0, 300) });
    return { allowed: true };
  }
}

function inconclusiveModerationResult(reason: string): ImageModerationResult {
  logStageGeneration("moderation_inconclusive_allowed", { reason });
  return { allowed: true };
}

async function callGeminiModeration(
  apiKey: string,
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>,
): Promise<ImageModerationResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
        },
      }),
    },
  );

  const rawBody = await response.text();

  if (!response.ok) {
    logStageGeneration("moderation_api_error", {
      status: response.status,
      body: rawBody.slice(0, 400),
    });
    return inconclusiveModerationResult(`http_${response.status}`);
  }

  try {
    const payload = JSON.parse(rawBody) as {
      promptFeedback?: { blockReason?: string };
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const blockReason = payload.promptFeedback?.blockReason;
    if (blockReason) {
      return inconclusiveModerationResult(`prompt_blocked:${blockReason}`);
    }

    const candidate = payload.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      return inconclusiveModerationResult(`finish_${finishReason}`);
    }

    const text = candidate?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return inconclusiveModerationResult("empty_response");
    }

    const parsed = parseModerationResponse(text);
    if (!parsed.allowed) {
      return parsed;
    }

    return parsed;
  } catch {
    return inconclusiveModerationResult("response_parse_error");
  }
}

export async function moderateUploadImages(
  imageUrls: string[],
  apiKey?: string,
): Promise<ImageModerationResult> {
  const urls = imageUrls.map((url) => url.trim()).filter(Boolean);
  if (urls.length === 0) {
    return { allowed: true };
  }

  const key = apiKey?.trim();
  if (!key) {
    logStageGeneration("moderation_skipped", {
      reason: "GEMINI_API_KEY missing — moderation skipped",
      imageCount: urls.length,
    });
    return { allowed: true };
  }

  const imageParts = await fetchImagePartsForGemini(urls, MODERATION_MAX_IMAGES);
  if (imageParts.length === 0) {
    logStageGeneration("moderation_no_images_loaded", { requested: urls.length });
    return {
      allowed: false,
      reason: "We could not load your photos for review. Try uploading again.",
    };
  }

  logStageGeneration("moderation_start", {
    requestedImages: urls.length,
    attachedImages: imageParts.length,
  });

  const parts = [{ text: MODERATION_PROMPT }, ...imageParts];
  const result = await callGeminiModeration(key, parts);

  logStageGeneration("moderation_result", {
    allowed: result.allowed,
    reason: result.reason ?? null,
    attachedImages: imageParts.length,
  });

  return result;
}

export async function assertUploadImagesAllowed(
  imageUrls: string[],
  apiKey?: string,
): Promise<void> {
  const result = await moderateUploadImages(imageUrls, apiKey);
  if (!result.allowed) {
    throw new ContentModerationError(
      result.reason ??
        "One or more photos violate our content policy. Please upload different images.",
    );
  }
}
