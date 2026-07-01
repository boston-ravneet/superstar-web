import { logStageGeneration } from "@/lib/ai/stage-generation-log";
import { getBindings } from "@/lib/cloudflare/env";
import { extractMediaObjectKey } from "@/lib/media/urls";

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

async function loadImageBytes(
  url: string,
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const key = extractMediaObjectKey(url);

  if (key) {
    try {
      const { MEDIA_BUCKET } = await getBindings();
      const object = await MEDIA_BUCKET.get(key);

      if (object) {
        const buffer = await object.arrayBuffer();
        const contentType =
          object.httpMetadata?.contentType ?? mimeFromUrl(url);
        return { buffer, contentType };
      }
    } catch (error) {
      logStageGeneration("vision_image_r2_fetch_error", {
        url,
        key,
        error: error instanceof Error ? error.message : "R2 fetch failed",
      });
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? mimeFromUrl(url);
  return { buffer, contentType };
}

export async function fetchImagePartsForGemini(
  imageUrls: string[],
  maxImages = MAX_IMAGES,
): Promise<GeminiImagePart[]> {
  const parts: GeminiImagePart[] = [];
  const limit = Math.max(1, Math.min(maxImages, imageUrls.length));

  for (const [index, url] of imageUrls.slice(0, limit).entries()) {
    if (!url?.trim()) {
      continue;
    }

    try {
      const loaded = await loadImageBytes(url);
      if (!loaded) {
        logStageGeneration("vision_image_fetch_failed", {
          index,
          url,
        });
        continue;
      }

      const { buffer, contentType } = loaded;

      if (buffer.byteLength > MAX_BYTES) {
        logStageGeneration("vision_image_skipped_large", {
          index,
          url,
          bytes: buffer.byteLength,
        });
        continue;
      }

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
        source: extractMediaObjectKey(url) ? "r2" : "http",
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
