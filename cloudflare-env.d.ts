interface CloudflareEnv {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  NEXT_INC_CACHE_R2_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  IMAGES: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  R2_PUBLIC_BASE_URL: string;
  UPLOAD_SIGNING_SECRET: string;
}

declare global {
  type Env = CloudflareEnv;
}

export {};
