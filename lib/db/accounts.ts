import type {
  AccountAuthProvider,
  AccountPublicView,
  AccountRecord,
} from "@/lib/types/account";

export function mapAccountRecord(record: AccountRecord): AccountPublicView {
  return {
    id: record.id,
    email: record.email,
    displayName: record.display_name,
    authProvider: record.auth_provider,
  };
}

export async function findAccountByAuth(
  db: D1Database,
  provider: AccountAuthProvider,
  subject: string,
): Promise<AccountRecord | null> {
  return db
    .prepare(
      `SELECT id, email, display_name, auth_provider, auth_subject, created_at, updated_at
       FROM accounts
       WHERE auth_provider = ? AND auth_subject = ?
       LIMIT 1`,
    )
    .bind(provider, subject)
    .first<AccountRecord>();
}

export async function upsertAccount(
  db: D1Database,
  input: {
    provider: AccountAuthProvider;
    subject: string;
    email?: string | null;
    displayName?: string | null;
  },
): Promise<AccountRecord> {
  const existing = await findAccountByAuth(db, input.provider, input.subject);

  if (existing) {
    await db
      .prepare(
        `UPDATE accounts
         SET email = COALESCE(?, email),
             display_name = COALESCE(?, display_name),
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        input.email ?? null,
        input.displayName ?? null,
        existing.id,
      )
      .run();

    const updated = await db
      .prepare(
        `SELECT id, email, display_name, auth_provider, auth_subject, created_at, updated_at
         FROM accounts WHERE id = ? LIMIT 1`,
      )
      .bind(existing.id)
      .first<AccountRecord>();

    if (!updated) {
      throw new Error("Account update failed.");
    }

    return updated;
  }

  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO accounts (id, email, display_name, auth_provider, auth_subject)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.email ?? null,
      input.displayName ?? null,
      input.provider,
      input.subject,
    )
    .run();

  const created = await db
    .prepare(
      `SELECT id, email, display_name, auth_provider, auth_subject, created_at, updated_at
       FROM accounts WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<AccountRecord>();

  if (!created) {
    throw new Error("Account creation failed.");
  }

  return created;
}

export async function getAccountById(
  db: D1Database,
  accountId: string,
): Promise<AccountRecord | null> {
  return db
    .prepare(
      `SELECT id, email, display_name, auth_provider, auth_subject, created_at, updated_at
       FROM accounts WHERE id = ? LIMIT 1`,
    )
    .bind(accountId)
    .first<AccountRecord>();
}

export async function listProfilesForAccount(
  db: D1Database,
  accountId: string,
): Promise<
  Array<{
    id: string;
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
    publish_status: string;
    is_verified: number;
    is_locked: number;
  }>
> {
  const result = await db
    .prepare(
      `SELECT id, username, display_name, profile_image_url,
              COALESCE(publish_status, 'draft') AS publish_status,
              is_verified, is_locked
       FROM profiles
       WHERE account_id = ?
       ORDER BY created_at ASC`,
    )
    .bind(accountId)
    .all<{
      id: string;
      username: string;
      display_name: string | null;
      profile_image_url: string | null;
      publish_status: string;
      is_verified: number;
      is_locked: number;
    }>();

  return result.results ?? [];
}

export async function profileOwnedByAccount(
  db: D1Database,
  accountId: string,
  profileId: string,
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM profiles WHERE id = ? AND account_id = ? LIMIT 1`)
    .bind(profileId, accountId)
    .first<{ id: string }>();

  return Boolean(row);
}
