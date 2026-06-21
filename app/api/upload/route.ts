import { getBindings } from "@/lib/cloudflare/env";
import { getRequestWebBase } from "@/lib/api/request-web-base";
import { buildMediaPublicUrl } from "@/lib/media/urls";
import { updateProfileImage, usernameExists } from "@/lib/db/profiles";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createSignedUploadToken,
  uploadProfileAsset,
  verifySignedUploadToken,
} from "@/lib/r2/storage";
import { validateUsernameFormat } from "@/lib/validation/username";

export const runtime = "nodejs";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return jsonError("Query parameter 'username' is required.", "USERNAME_REQUIRED", 400);
    }

    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      return jsonError(
        validation.error ?? "Invalid username.",
        validation.code ?? "USERNAME_INVALID",
        400,
      );
    }

    const { UPLOAD_SIGNING_SECRET } = await getBindings();
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    const uploadToken = await createSignedUploadToken(
      UPLOAD_SIGNING_SECRET,
      validation.normalized,
      expiresAt,
    );

    return jsonOk({
      username: validation.normalized,
      uploadToken,
      expiresAt,
      uploadUrl: "/api/upload",
      maxBytes: 512_000,
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to issue upload token.";
    return jsonError(message, "UPLOAD_TOKEN_FAILED", 500);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const username = String(formData.get("username") ?? "");
    const uploadToken = String(formData.get("uploadToken") ?? "");
    const file = formData.get("file");

    if (!username || !uploadToken) {
      return jsonError(
        "Fields 'username' and 'uploadToken' are required.",
        "UPLOAD_FIELDS_REQUIRED",
        400,
      );
    }

    if (!(file instanceof File)) {
      return jsonError("Field 'file' must be an image upload.", "UPLOAD_FILE_REQUIRED", 400);
    }

    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      return jsonError(
        validation.error ?? "Invalid username.",
        validation.code ?? "USERNAME_INVALID",
        400,
      );
    }

    const { DB, MEDIA_BUCKET, UPLOAD_SIGNING_SECRET } = await getBindings();

    const tokenValid = await verifySignedUploadToken(
      UPLOAD_SIGNING_SECRET,
      uploadToken,
      validation.normalized,
    );

    if (!tokenValid) {
      return jsonError("Upload token is invalid or expired.", "UPLOAD_TOKEN_INVALID", 401);
    }

    const exists = await usernameExists(DB, validation.normalized);
    if (!exists) {
      return jsonError(
        "Profile must exist before uploading media.",
        "PROFILE_NOT_FOUND",
        404,
      );
    }

    const upload = await uploadProfileAsset({
      bucket: MEDIA_BUCKET,
      username: validation.normalized,
      file,
      publicBaseUrl: `${getRequestWebBase(request)}/media`,
    });

    const publicUrl = buildMediaPublicUrl(
      getRequestWebBase(request),
      upload.key,
    );

    await updateProfileImage(DB, validation.normalized, publicUrl);

    return jsonOk({ ...upload, publicUrl }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    return jsonError(message, "UPLOAD_FAILED", 500);
  }
}
