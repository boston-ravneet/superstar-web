import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface SuperstarBindings {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  R2_PUBLIC_BASE_URL: string;
  UPLOAD_SIGNING_SECRET: string;
  SESSION_SIGNING_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  ALLOW_DEV_AUTH?: string;
  GEMINI_API_KEY?: string;
}

type BindingsEnv = SuperstarBindings & Record<string, unknown>;

export async function getBindings(): Promise<SuperstarBindings> {
  const { env } = await getCloudflareContext({ async: true });
  const bindings = env as BindingsEnv;

  const db = bindings.DB;
  const mediaBucket = bindings.MEDIA_BUCKET;
  const publicBaseUrl =
    bindings.R2_PUBLIC_BASE_URL ?? "https://media.getsuperstar.info";
  const uploadSigningSecret =
    bindings.UPLOAD_SIGNING_SECRET ?? "dev-upload-secret-change-in-production";

  if (!db) {
    throw new Error("D1 binding DB is not configured.");
  }

  if (!mediaBucket) {
    throw new Error("R2 binding MEDIA_BUCKET is not configured.");
  }

  return {
    DB: db,
    MEDIA_BUCKET: mediaBucket,
    R2_PUBLIC_BASE_URL: publicBaseUrl.replace(/\/$/, ""),
    UPLOAD_SIGNING_SECRET: uploadSigningSecret,
    SESSION_SIGNING_SECRET:
      typeof bindings.SESSION_SIGNING_SECRET === "string"
        ? bindings.SESSION_SIGNING_SECRET
        : undefined,
    GOOGLE_CLIENT_ID:
      typeof bindings.GOOGLE_CLIENT_ID === "string"
        ? bindings.GOOGLE_CLIENT_ID
        : undefined,
    ALLOW_DEV_AUTH:
      typeof bindings.ALLOW_DEV_AUTH === "string"
        ? bindings.ALLOW_DEV_AUTH
        : undefined,
    GEMINI_API_KEY:
      (typeof bindings.GEMINI_API_KEY === "string" &&
        bindings.GEMINI_API_KEY.trim()) ||
      process.env.GEMINI_API_KEY?.trim() ||
      undefined,
  };
}
