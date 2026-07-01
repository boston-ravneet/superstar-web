import type { UploadResponse } from "@/lib/types/profile";
import { normalizeUsername } from "@/lib/constants/premium-usernames";

const MAX_UPLOAD_BYTES = 512_000;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export interface UploadableImage {
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface UploadAssetInput {
  bucket: R2Bucket;
  username: string;
  file: UploadableImage;
  publicBaseUrl: string;
}

function extensionForContentType(contentType: string): string {
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/png") return "png";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

function buildObjectKey(username: string, contentType: string): string {
  const normalized = normalizeUsername(username);
  const extension = extensionForContentType(contentType);
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);
  return `profiles/${normalized}/${timestamp}-${random}.${extension}`;
}

export async function uploadProfileAsset(
  input: UploadAssetInput,
): Promise<UploadResponse> {
  const { bucket, username, file, publicBaseUrl } = input;

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image exceeds the 512KB upload limit.");
  }

  const key = buildObjectKey(username, file.type);
  const buffer = await file.arrayBuffer();

  await bucket.put(key, buffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return {
    key,
    publicUrl: `${publicBaseUrl}/${key}`,
    contentType: file.type,
    sizeBytes: file.size,
  };
}

export async function createSignedUploadToken(
  secret: string,
  username: string,
  expiresAtMs: number,
): Promise<string> {
  const normalized = normalizeUsername(username);
  const payload = `${normalized}:${expiresAtMs}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `${payload}:${signatureHex}`;
}

export async function verifySignedUploadToken(
  secret: string,
  token: string,
  username: string,
): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const parts = token.split(":");
  if (parts.length !== 3) {
    return false;
  }

  const [tokenUsername, expiresAtRaw, providedSignature] = parts;
  if (tokenUsername !== normalized) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = await createSignedUploadToken(secret, normalized, expiresAt);
  const expectedSignature = expected.split(":")[2];
  return expectedSignature === providedSignature;
}
