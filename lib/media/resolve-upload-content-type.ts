const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function contentTypeFromFileName(fileName: string): string | null {
  const lower = fileName.trim().toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  return null;
}

export function resolveUploadContentType(input: {
  fileType?: string | null;
  fileName?: string | null;
  formContentType?: string | null;
}): string | null {
  const candidates = [
    input.formContentType?.trim(),
    input.fileType?.trim(),
    input.fileName ? contentTypeFromFileName(input.fileName) : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (ALLOWED_IMAGE_TYPES.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function uploadableImageWithType(
  file: Blob,
  contentType: string,
): { type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> } {
  return {
    type: contentType,
    get size() {
      return file.size;
    },
    arrayBuffer: () => file.arrayBuffer(),
  };
}
