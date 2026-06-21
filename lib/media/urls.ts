import type { StageTemplateDocument } from "@/lib/types/stage-template";

const MEDIA_KEY_PATTERN = /^profiles\/[a-z0-9_]+\/[a-zA-Z0-9._-]+$/;

export function extractMediaObjectKey(url: string): string | null {
  if (!url?.trim()) {
    return null;
  }

  try {
    const pathname = new URL(url).pathname;
    const mediaPrefix = "/media/";
    const mediaIndex = pathname.indexOf(mediaPrefix);
    if (mediaIndex >= 0) {
      const key = pathname.slice(mediaIndex + mediaPrefix.length).replace(/^\/+/, "");
      return MEDIA_KEY_PATTERN.test(key) ? key : null;
    }

    const profilesIndex = pathname.indexOf("/profiles/");
    if (profilesIndex >= 0) {
      const key = pathname.slice(profilesIndex + 1);
      return MEDIA_KEY_PATTERN.test(key) ? key : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildMediaPublicUrl(webBase: string, objectKey: string): string {
  const base = webBase.replace(/\/$/, "");
  const key = objectKey.replace(/^\/+/, "");
  return `${base}/media/${key}`;
}

export function rewriteMediaUrl(url: string, webBase: string): string {
  const key = extractMediaObjectKey(url);
  if (!key) {
    return url;
  }
  return buildMediaPublicUrl(webBase, key);
}

export function rewriteMediaUrlsInTemplate(
  template: StageTemplateDocument,
  webBase: string,
): StageTemplateDocument {
  return {
    ...template,
    sections: template.sections.map((section) => {
      const content = { ...section.content };

      if (typeof content.avatarUrl === "string") {
        content.avatarUrl = rewriteMediaUrl(content.avatarUrl, webBase);
      }

      if (Array.isArray(content.images)) {
        content.images = (
          content.images as Array<{ url?: string; caption?: string; span?: number }>
        ).map((image) => ({
          ...image,
          url: image.url ? rewriteMediaUrl(image.url, webBase) : image.url,
        }));
      }

      return { ...section, content };
    }),
  };
}
