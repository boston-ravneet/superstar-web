import type { PublishStatus } from "@/lib/types/stage-template";
import type { ProfileBuilderInput } from "@/lib/types/stage-template";
import type { StageTemplateDocument } from "@/lib/types/stage-template";
import {
  parseStageTemplate,
  serializeStageTemplate,
} from "@/lib/stage/parse-stage-template";
import { templateToLayoutConfig } from "@/lib/stage/template-to-layout";
import { serializeLayoutConfig, parseLayoutConfig } from "@/lib/stage/parse-layout-config";
import { generateStageTemplate } from "@/lib/ai/generate-stage-template";
import type { GenerationResult } from "@/lib/ai/generate-stage-template";
import { normalizeBuilderInput } from "@/lib/stage/enrich-stage-template";
import {
  applyBioDisplayMode,
  ensurePolishedCopy,
  extractPolishedCopyFromTemplate,
  resolveBioDisplayMode,
  type BioDisplayMode,
} from "@/lib/stage/bio-display";
import { summarizeBioProfessionally } from "@/lib/ai/bio-copy";
import { logProfileChange } from "@/lib/db/profile-change-log";

function keepsPublishedLive(status: PublishStatus): boolean {
  return status === "published";
}

function statusWhileEditing(
  current: PublishStatus,
  phase: "generating" | "preview" | "error",
): PublishStatus {
  if (keepsPublishedLive(current)) {
    return "published";
  }

  if (phase === "generating") {
    return "generating";
  }

  if (phase === "preview") {
    return "preview";
  }

  return "draft";
}

function padImageUrls(urls: string[]): [string, string, string] | null {
  const unique = urls.filter(Boolean).filter(
    (url, index, array) => array.indexOf(url) === index,
  );

  if (unique.length === 0) {
    return null;
  }

  while (unique.length < 3) {
    unique.push(unique[unique.length - 1]);
  }

  return [unique[0], unique[1], unique[2]];
}

export function resolveBuilderInputForEdit(
  profile: BuilderProfileRow,
): ProfileBuilderInput {
  const stored = profile.builder_input_json
    ? normalizeBuilderInput(JSON.parse(profile.builder_input_json), profile)
    : null;

  if (stored?.imageUrls?.length) {
    const padded = padImageUrls(stored.imageUrls);
    if (padded) {
      return {
        ...stored,
        bio: stored.bio || profile.bio || "",
        imageUrls: padded,
        instagramHandle: profile.instagram_handle,
        tiktokHandle: profile.tiktok_handle,
      };
    }
  }

  const layout = parseLayoutConfig(profile.layout_config_json ?? "{}");
  const fromGallery = layout.gallery_urls.map((entry) => entry.url);
  const candidates = [profile.profile_image_url, ...fromGallery].filter(
    (url): url is string => Boolean(url),
  );
  const padded = padImageUrls(candidates);

  return {
    bio: profile.bio ?? "",
    designInstructions: stored?.designInstructions,
    imageUrls: padded ?? ["", "", ""],
    displayName: profile.display_name ?? profile.username,
    username: profile.username,
    instagramHandle: profile.instagram_handle,
    tiktokHandle: profile.tiktok_handle,
  };
}

export interface BuilderProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  layout_config_json: string | null;
  publish_status: PublishStatus;
  stage_template_json: string | null;
  builder_input_json: string | null;
  generation_error: string | null;
  account_id: string | null;
}

export async function getBuilderProfile(
  db: D1Database,
  profileId: string,
): Promise<BuilderProfileRow | null> {
  return db
    .prepare(
      `SELECT
        id, username, display_name, bio, profile_image_url,
        instagram_handle, tiktok_handle,
        COALESCE(layout_config_json, '{}') AS layout_config_json,
        COALESCE(publish_status, 'draft') AS publish_status,
        stage_template_json, builder_input_json, generation_error,
        account_id
       FROM profiles
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(profileId)
    .first<BuilderProfileRow>();
}

export async function saveBuilderInput(
  db: D1Database,
  profileId: string,
  input: ProfileBuilderInput,
  options?: { accountId?: string },
): Promise<void> {
  const profile = await getBuilderProfile(db, profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const nextStatus = statusWhileEditing(profile.publish_status, "generating");

  await db
    .prepare(
      `UPDATE profiles
       SET bio = ?,
           profile_image_url = ?,
           builder_input_json = ?,
           publish_status = ?,
           generation_error = NULL,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      input.bio,
      input.imageUrls[0] ?? null,
      JSON.stringify(input),
      nextStatus,
      profileId,
    )
    .run();

  await logProfileChange(db, {
    profileId,
    accountId: options?.accountId,
    event: "builder.submit",
    detail: {
      publishStatusBefore: profile.publish_status,
      publishStatusAfter: nextStatus,
      bioLength: input.bio.length,
      hasDesignInstructions: Boolean(input.designInstructions?.trim()),
    },
  });
}

function withPolishedCopyFromTemplate(
  input: ProfileBuilderInput,
  template: StageTemplateDocument,
  mode?: BioDisplayMode,
  source?: "gemini" | "fallback",
): ProfileBuilderInput {
  const localPolish = summarizeBioProfessionally(input.bio, input.displayName);
  const extracted = extractPolishedCopyFromTemplate(template);

  const polishedBio =
    source === "gemini" && extracted.polishedBio
      ? extracted.polishedBio
      : localPolish.about;

  const polishedTagline =
    source === "gemini" && extracted.polishedTagline
      ? extracted.polishedTagline
      : localPolish.tagline;

  return {
    ...input,
    bioDisplayMode: mode ?? input.bioDisplayMode ?? "polished",
    polishedBio,
    polishedTagline,
  };
}

export async function setBioDisplayMode(
  db: D1Database,
  profileId: string,
  useOriginalBio: boolean,
  options?: { accountId?: string },
): Promise<{ template: StageTemplateDocument; bioDisplayMode: BioDisplayMode }> {
  const profile = await getBuilderProfile(db, profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const storedInput = profile.builder_input_json
    ? normalizeBuilderInput(JSON.parse(profile.builder_input_json), profile)
    : null;

  if (!storedInput) {
    throw new Error("Builder input is missing.");
  }

  const parsedTemplate = parseStageTemplate(profile.stage_template_json ?? null);
  if (!parsedTemplate) {
    throw new Error("No template to update.");
  }

  const mode: BioDisplayMode = useOriginalBio ? "original" : "polished";
  const inputWithPolished = ensurePolishedCopy(storedInput, parsedTemplate);
  const refreshedPolish = summarizeBioProfessionally(
    inputWithPolished.bio,
    inputWithPolished.displayName,
  );
  const updatedInput: ProfileBuilderInput = {
    ...inputWithPolished,
    bioDisplayMode: mode,
    polishedBio: refreshedPolish.about,
    polishedTagline: refreshedPolish.tagline,
  };
  const updatedTemplate = applyBioDisplayMode(
    parsedTemplate,
    updatedInput,
    mode,
  );

  const layoutConfig = templateToLayoutConfig(updatedTemplate, updatedInput.imageUrls);

  await db
    .prepare(
      `UPDATE profiles
       SET stage_template_json = ?,
           layout_config_json = ?,
           builder_input_json = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      serializeStageTemplate(updatedTemplate),
      serializeLayoutConfig(layoutConfig),
      JSON.stringify(updatedInput),
      profileId,
    )
    .run();

  await logProfileChange(db, {
    profileId,
    accountId: options?.accountId,
    event: "builder.bio_source",
    detail: {
      bioDisplayMode: mode,
      useOriginalBio,
    },
  });

  return { template: updatedTemplate, bioDisplayMode: mode };
}

export async function runTemplateGeneration(
  db: D1Database,
  profileId: string,
  apiKey?: string,
  refinePrompt?: string,
  options?: { accountId?: string },
): Promise<GenerationResult> {
  const profile = await getBuilderProfile(db, profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  await db
    .prepare(
      `UPDATE profiles
       SET generation_error = NULL, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(profileId)
    .run();

  const storedInput = profile.builder_input_json
    ? normalizeBuilderInput(JSON.parse(profile.builder_input_json), profile)
    : null;

  if (!storedInput) {
    throw new Error("Builder input is missing.");
  }

  const currentTemplate = refinePrompt
    ? parseStageTemplate(profile.stage_template_json ?? null) ?? undefined
    : undefined;

  try {
    const result = await generateStageTemplate(storedInput, {
      apiKey,
      refinePrompt,
      currentTemplate,
    });

    let template = result.template;
    const mode = resolveBioDisplayMode(storedInput);
    let updatedInput = withPolishedCopyFromTemplate(
      storedInput,
      template,
      mode,
      result.source,
    );

    if (mode === "polished") {
      template = applyBioDisplayMode(template, updatedInput, "polished");
    } else {
      template = applyBioDisplayMode(template, updatedInput, "original");
    }

    const layoutConfig = templateToLayoutConfig(template, storedInput.imageUrls);
    const nextStatus = statusWhileEditing(profile.publish_status, "preview");

    await db
      .prepare(
        `UPDATE profiles
         SET stage_template_json = ?,
             layout_config_json = ?,
             publish_status = ?,
             generation_error = ?,
             builder_input_json = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        serializeStageTemplate(template),
        serializeLayoutConfig(layoutConfig),
        nextStatus,
        result.source === "fallback" ? result.error ?? "Used local fallback builder" : null,
        JSON.stringify(updatedInput),
        profileId,
      )
      .run();

    await logProfileChange(db, {
      profileId,
      accountId: options?.accountId,
      event: refinePrompt ? "builder.refine" : "builder.generate",
      detail: {
        generationSource: result.source,
        generationError: result.error ?? null,
        refinePrompt: refinePrompt ?? null,
        publishStatusBefore: profile.publish_status,
        publishStatusAfter: nextStatus,
      },
    });

    return { ...result, template };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Template generation failed.";
    const nextStatus = statusWhileEditing(profile.publish_status, "error");

    await db
      .prepare(
        `UPDATE profiles
         SET publish_status = ?,
             generation_error = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(nextStatus, message, profileId)
      .run();

    await logProfileChange(db, {
      profileId,
      accountId: options?.accountId,
      event: refinePrompt ? "builder.refine" : "builder.generate",
      detail: {
        failed: true,
        error: message,
        refinePrompt: refinePrompt ?? null,
        publishStatusBefore: profile.publish_status,
        publishStatusAfter: nextStatus,
      },
    });

    throw error;
  }
}

export async function publishBuilderProfile(
  db: D1Database,
  profileId: string,
  options?: { accountId?: string },
): Promise<void> {
  const profile = await getBuilderProfile(db, profileId);
  if (!profile?.stage_template_json) {
    throw new Error("No template to publish.");
  }

  const template = parseStageTemplate(profile.stage_template_json);
  if (!template) {
    throw new Error("Stored template is invalid.");
  }

  const input = profile.builder_input_json
    ? (JSON.parse(profile.builder_input_json) as ProfileBuilderInput)
    : { imageUrls: [] as string[] };

  const layoutConfig = templateToLayoutConfig(template, input.imageUrls);
  const serializedTemplate = serializeStageTemplate(template);

  await db
    .prepare(
      `UPDATE profiles
       SET publish_status = 'published',
           published_stage_template_json = ?,
           layout_config_json = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(serializedTemplate, serializeLayoutConfig(layoutConfig), profileId)
    .run();

  await logProfileChange(db, {
    profileId,
    accountId: options?.accountId,
    event: "builder.publish",
    detail: {
      publishStatusBefore: profile.publish_status,
      publishStatusAfter: "published",
      username: profile.username,
    },
  });
}

export function parseBuilderInput(json: string | null): ProfileBuilderInput | null {
  if (!json?.trim()) {
    return null;
  }

  try {
    return normalizeBuilderInput(JSON.parse(json));
  } catch {
    return null;
  }
}
