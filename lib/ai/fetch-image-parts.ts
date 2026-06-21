import { logStageGeneration } from "@/lib/ai/stage-generation-log";

export interface GeminiImagePart {
  inline_data: {
    mime_type: string;
    data: string;
  };
}

const MAX_IMAGES = 3;
const MAX_BYTES = 512_000;

function mimeFromUrl(url: string): string {
  if (url.includes(".webp")) {
    return "image/webp";
  }
  if (url.includes(".png")) {
    return "image/png";
  }
  if (url.includes(".gif")) {
    return "image/gif";
  }
  return "image/jpeg";
}

function normalizeFetchUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("/media/profiles/")) {
      return `http://127.0.0.1:3000${parsed.pathname}`;
    }
  } catch {
    return url;
  }
  return url;
}

export async function fetchImagePartsForGemini(
  imageUrls: string[],
): Promise<GeminiImagePart[]> {
  const parts: GeminiImagePart[] = [];

  for (const [index, url] of imageUrls.slice(0, MAX_IMAGES).entries()) {
    if (!url?.trim()) {
      continue;
    }

    const fetchUrl = normalizeFetchUrl(url);

    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        logStageGeneration("vision_image_fetch_failed", {
          index,
          url,
          status: response.status,
        });
        continue;
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_BYTES) {
        logStageGeneration("vision_image_skipped_large", {
          index,
          url,
          bytes: buffer.byteLength,
        });
        continue;
      }

      const contentType = response.headers.get("content-type") ?? mimeFromUrl(url);
      const base64 = Buffer.from(buffer).toString("base64");

      parts.push({
        inline_data: {
          mime_type: contentType.split(";")[0] || mimeFromUrl(url),
          data: base64,
        },
      });

      logStageGeneration("vision_image_attached", {
        index,
        url,
        bytes: buffer.byteLength,
        mimeType: contentType,
      });
    } catch (error) {
      logStageGeneration("vision_image_fetch_error", {
        index,
        url,
        error: error instanceof Error ? error.message : "fetch failed",
      });
    }
  }

  return parts;
}
