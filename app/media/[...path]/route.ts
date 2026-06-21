import { getBindings } from "@/lib/cloudflare/env";

export const runtime = "nodejs";

const ALLOWED_KEY = /^profiles\/[a-z0-9_]+\/[a-zA-Z0-9._-]+$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const key = path.join("/");

    if (!ALLOWED_KEY.test(key)) {
      return new Response("Not found", { status: 404 });
    }

    const { MEDIA_BUCKET } = await getBindings();
    const object = await MEDIA_BUCKET.get(key);

    if (!object) {
      console.error(`[media] object not found: ${key}`);
      return new Response("Not found", { status: 404 });
    }

    const responseHeaders = new Headers();
    const contentType =
      object.httpMetadata?.contentType ??
      (key.endsWith(".webp") ? "image/webp" : "application/octet-stream");

    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    if (object.httpEtag) {
      responseHeaders.set("ETag", object.httpEtag);
    }

    const body = await object.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown media error";
    console.error("[media] failed to load:", message);
    return new Response(`Unable to load media: ${message}`, { status: 500 });
  }
}
