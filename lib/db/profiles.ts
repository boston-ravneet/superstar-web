import type { ProfileRecord } from "@/lib/types/profile";
import type { ProfileUpdatePayload } from "@/lib/types/layout";
import type { StageProfileView } from "@/lib/types/stage";
import { buildStageProfileView } from "@/lib/stage/build-stage-view";
import { normalizeUsername } from "@/lib/constants/premium-usernames";
import { serializeLayoutConfig } from "@/lib/stage/parse-layout-config";
import { serializeSocialLinksPayload } from "@/lib/stage/serialize-social-links";
import {
  legacyHandlesFromAccounts,
  normalizeSocialAccounts,
  serializeSocialAccountsPayload,
} from "@/lib/stage/social-accounts";
import type { RegistrationPayload, ProfilePublicView } from "@/lib/types/profile";
import { parseSocialLinksPayload } from "@/lib/stage/parse-social-links";

function mapRecordToPublicView(record: ProfileRecord): ProfilePublicView {
  const payload = parseSocialLinksPayload(record.social_links_json);

  return {
    id: record.id,
    username: record.username,
    displayName: record.display_name ?? record.username,
    bio: record.bio ?? "",
    profileImageUrl: record.profile_image_url,
    socialLinks: payload.links ?? [],
    instagramHandle: record.instagram_handle,
    tiktokHandle: record.tiktok_handle,
    isVerified: record.is_verified === 1,
    isLocked: record.is_locked === 1,
  };
}

async function fetchProfileRecordById(
  db: D1Database,
  userId: string,
): Promise<ProfileRecord | null> {
  const profilesRow = await db
    .prepare(
      `SELECT
        id, username, display_name, bio, profile_image_url,
        instagram_handle, tiktok_handle, social_links_json,
        COALESCE(layout_config_json, '{}') AS layout_config_json,
        stage_template_json,
        published_stage_template_json,
        COALESCE(publish_status, 'draft') AS publish_status,
        builder_input_json,
        generation_error,
        is_verified, is_locked, oauth_provider, oauth_subject,
        created_at, updated_at,
        NULL AS profile_status
      FROM profiles
      WHERE id = ?
      LIMIT 1`,
    )
    .bind(userId)
    .first<ProfileRecord>();

  if (profilesRow) {
    return profilesRow;
  }

  try {
    const usersRow = await db
      .prepare(
        `SELECT
          id, username, display_name, bio, profile_image_url,
          instagram_handle, tiktok_handle,
          is_verified, is_locked,
          COALESCE(profile_status, 'active') AS profile_status,
          created_at, updated_at,
          '[]' AS social_links_json,
          COALESCE(layout_config_json, '{}') AS layout_config_json,
          NULL AS oauth_provider,
          NULL AS oauth_subject
        FROM users
        WHERE id = ?
        LIMIT 1`,
      )
      .bind(userId)
      .first<ProfileRecord>();

    return usersRow ?? null;
  } catch {
    return null;
  }
}

async function fetchProfileRecord(
  db: D1Database,
  username: string,
): Promise<ProfileRecord | null> {
  const normalized = normalizeUsername(username);

  const profilesRow = await db
    .prepare(
      `SELECT
        id, username, display_name, bio, profile_image_url,
        instagram_handle, tiktok_handle, social_links_json,
        COALESCE(layout_config_json, '{}') AS layout_config_json,
        stage_template_json,
        published_stage_template_json,
        COALESCE(publish_status, 'draft') AS publish_status,
        builder_input_json,
        generation_error,
        is_verified, is_locked, oauth_provider, oauth_subject,
        created_at, updated_at,
        NULL AS profile_status
      FROM profiles
      WHERE username = ? COLLATE NOCASE
      LIMIT 1`,
    )
    .bind(normalized)
    .first<ProfileRecord>();

  if (profilesRow) {
    return profilesRow;
  }

  try {
    const usersRow = await db
      .prepare(
        `SELECT
          id, username, display_name, bio, profile_image_url,
          instagram_handle, tiktok_handle,
          is_verified, is_locked,
          COALESCE(profile_status, 'active') AS profile_status,
          created_at, updated_at,
          '[]' AS social_links_json,
          COALESCE(layout_config_json, '{}') AS layout_config_json,
          NULL AS oauth_provider,
          NULL AS oauth_subject
        FROM users
        WHERE username = ? COLLATE NOCASE
        LIMIT 1`,
      )
      .bind(normalized)
      .first<ProfileRecord>();

    return usersRow ?? null;
  } catch {
    return null;
  }
}

export async function getProfileByUsername(
  db: D1Database,
  username: string,
): Promise<ProfilePublicView | null> {
  const record = await fetchProfileRecord(db, username);
  return record ? mapRecordToPublicView(record) : null;
}

export async function getStageProfileByUsername(
  db: D1Database,
  username: string,
): Promise<StageProfileView | null> {
  const record = await fetchProfileRecord(db, username);
  return record ? buildStageProfileView(record) : null;
}

export async function getProfileRecordById(
  db: D1Database,
  userId: string,
): Promise<ProfileRecord | null> {
  return fetchProfileRecordById(db, userId);
}

export async function usernameExists(
  db: D1Database,
  username: string,
): Promise<boolean> {
  const normalized = normalizeUsername(username);

  const profilesHit = await db
    .prepare(
      `SELECT id FROM profiles WHERE username = ? COLLATE NOCASE LIMIT 1`,
    )
    .bind(normalized)
    .first<{ id: string }>();

  if (profilesHit) {
    return true;
  }

  try {
    const usersHit = await db
      .prepare(`SELECT id FROM users WHERE username = ? COLLATE NOCASE LIMIT 1`)
      .bind(normalized)
      .first<{ id: string }>();

    return Boolean(usersHit);
  } catch {
    return false;
  }
}

export async function createProfile(
  db: D1Database,
  payload: RegistrationPayload,
  options: { isLocked: boolean; accountId: string },
): Promise<ProfilePublicView> {
  const normalized = normalizeUsername(payload.username);
  const id = crypto.randomUUID();
  const socialAccounts = normalizeSocialAccounts(payload.socialAccounts ?? []);
  const legacy = legacyHandlesFromAccounts(socialAccounts);
  const instagramHandle =
    payload.oauth?.provider === "instagram"
      ? normalized
      : legacy.instagramHandle;
  const tiktokHandle =
    payload.oauth?.provider === "tiktok" ? normalized : legacy.tiktokHandle;

  await db
    .prepare(
      `INSERT INTO profiles (
        id, username, display_name, bio, profile_image_url,
        instagram_handle, tiktok_handle, social_links_json,
        layout_config_json, account_id,
        publish_status,
        is_verified, is_locked, oauth_provider, oauth_subject
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, 'draft', 0, ?, ?, ?)`,
    )
    .bind(
      id,
      normalized,
      payload.displayName ?? normalized,
      payload.bio ?? "",
      payload.profileImageUrl ?? null,
      instagramHandle,
      tiktokHandle,
      socialAccounts.length
        ? serializeSocialAccountsPayload(socialAccounts)
        : serializeSocialLinksPayload(payload.socialLinks ?? []),
      options.accountId,
      options.isLocked ? 1 : 0,
      payload.oauth?.provider ?? null,
      payload.oauth?.subject ?? null,
    )
    .run();

  const created = await getProfileByUsername(db, normalized);

  if (!created) {
    throw new Error("Profile creation succeeded but record could not be loaded.");
  }

  return created;
}

export async function updateProfileImage(
  db: D1Database,
  username: string,
  imageUrl: string,
): Promise<void> {
  const normalized = normalizeUsername(username);

  await db
    .prepare(
      `UPDATE profiles
       SET profile_image_url = ?, updated_at = datetime('now')
       WHERE username = ? COLLATE NOCASE`,
    )
    .bind(imageUrl, normalized)
    .run();
}

export interface ProfileMutationInput {
  userId: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  layoutConfigJson: string;
}

export async function updateProfileByUserId(
  db: D1Database,
  input: ProfileMutationInput,
): Promise<StageProfileView | null> {
  const existing = await fetchProfileRecordById(db, input.userId);

  if (!existing) {
    return null;
  }

  const nextDisplayName =
    input.displayName !== undefined
      ? input.displayName.trim()
      : existing.display_name ?? existing.username;
  const nextBio =
    input.bio !== undefined ? input.bio : existing.bio ?? "";
  const nextProfileImageUrl =
    input.profileImageUrl !== undefined
      ? input.profileImageUrl
      : existing.profile_image_url;

  const profilesUpdated = await db
    .prepare(
      `UPDATE profiles
       SET display_name = ?,
           bio = ?,
           profile_image_url = ?,
           layout_config_json = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      nextDisplayName,
      nextBio,
      nextProfileImageUrl,
      input.layoutConfigJson,
      input.userId,
    )
    .run();

  if (profilesUpdated.meta.changes > 0) {
    const updated = await fetchProfileRecordById(db, input.userId);
    return updated ? buildStageProfileView(updated) : null;
  }

  try {
    const usersUpdated = await db
      .prepare(
        `UPDATE users
         SET display_name = ?,
             bio = ?,
             profile_image_url = ?,
             layout_config_json = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        nextDisplayName,
        nextBio,
        nextProfileImageUrl,
        input.layoutConfigJson,
        input.userId,
      )
      .run();

    if (usersUpdated.meta.changes === 0) {
      return null;
    }

    const updated = await fetchProfileRecordById(db, input.userId);
    return updated ? buildStageProfileView(updated) : null;
  } catch {
    return null;
  }
}
