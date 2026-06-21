export type ProfileChangeEvent =
  | "builder.submit"
  | "builder.generate"
  | "builder.refine"
  | "builder.publish"
  | "builder.bio_source";

export interface ProfileChangeLogRow {
  id: string;
  profile_id: string;
  account_id: string | null;
  event: ProfileChangeEvent;
  detail_json: string | null;
  created_at: string;
}

export async function logProfileChange(
  db: D1Database,
  input: {
    profileId: string;
    accountId?: string | null;
    event: ProfileChangeEvent;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO profile_change_logs (id, profile_id, account_id, event, detail_json)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.profileId,
      input.accountId ?? null,
      input.event,
      input.detail ? JSON.stringify(input.detail) : null,
    )
    .run();
}

export async function getProfileChangeLogs(
  db: D1Database,
  profileId: string,
  limit = 50,
): Promise<ProfileChangeLogRow[]> {
  const result = await db
    .prepare(
      `SELECT id, profile_id, account_id, event, detail_json, created_at
       FROM profile_change_logs
       WHERE profile_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(profileId, limit)
    .all<ProfileChangeLogRow>();

  return result.results ?? [];
}
