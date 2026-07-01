import { hasAcceptedCurrentTerms } from "@/lib/legal/terms-version";
import type {
  AccountAuthProvider,
  AccountPublicView,
  AccountRecord,
} from "@/lib/types/account";

const ACCOUNT_SELECT =
  `id, email, display_name, auth_provider, auth_subject,
   terms_accepted_at, terms_version, created_at, updated_at`;

export function mapAccountRecord(record: AccountRecord): AccountPublicView {
  return {
    id: record.id,
    email: record.email,
    displayName: record.display_name,
    authProvider: record.auth_provider,
    termsAcceptedAt: record.terms_accepted_at,
    termsVersion: record.terms_version,
    requiresTermsAcceptance: !hasAcceptedCurrentTerms({
      termsAcceptedAt: record.terms_accepted_at,
      termsVersion: record.terms_version,
    }),
  };
}

export async function findAccountByAuth(
  db: D1Database,
  provider: AccountAuthProvider,
  subject: string,
): Promise<AccountRecord | null> {
  return db
    .prepare(
      `SELECT ${ACCOUNT_SELECT}
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
      .prepare(`SELECT ${ACCOUNT_SELECT} FROM accounts WHERE id = ? LIMIT 1`)
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
    .prepare(`SELECT ${ACCOUNT_SELECT} FROM accounts WHERE id = ? LIMIT 1`)
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
    .prepare(`SELECT ${ACCOUNT_SELECT} FROM accounts WHERE id = ? LIMIT 1`)
    .bind(accountId)
    .first<AccountRecord>();
}

export async function acceptAccountTerms(
  db: D1Database,
  accountId: string,
  termsVersion: string,
): Promise<AccountRecord> {
  await db
    .prepare(
      `UPDATE accounts
       SET terms_accepted_at = datetime('now'),
           terms_version = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(termsVersion, accountId)
    .run();

  const updated = await getAccountById(db, accountId);
  if (!updated) {
    throw new Error("Account not found after accepting terms.");
  }

  return updated;
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

export async function deleteAccountAndData(
  db: D1Database,
  accountId: string,
): Promise<void> {
  const profiles = await listProfilesForAccount(db, accountId);
  const profileIds = profiles.map((profile) => profile.id);

  if (profileIds.length > 0) {
    const placeholders = profileIds.map(() => "?").join(", ");
    await db
      .prepare(
        `DELETE FROM profile_change_logs WHERE profile_id IN (${placeholders})`,
      )
      .bind(...profileIds)
      .run();
    await db
      .prepare(
        `DELETE FROM profile_analytics_daily WHERE profile_id IN (${placeholders})`,
      )
      .bind(...profileIds)
      .run();
    await db
      .prepare(`DELETE FROM profiles WHERE account_id = ?`)
      .bind(accountId)
      .run();
  }

  await db.prepare(`DELETE FROM accounts WHERE id = ?`).bind(accountId).run();
}
