export interface ProfileAnalyticsSummary {
  profileId: string;
  totalViews: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  daily: Array<{ date: string; views: number }>;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function isLikelyBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent?.trim()) {
    return false;
  }

  return /bot|crawler|spider|slurp|facebookexternalhit|preview|headless|wget|curl/i.test(
    userAgent,
  );
}

export async function recordProfilePageView(
  db: D1Database,
  profileId: string,
): Promise<void> {
  const viewDate = todayUtcDate();

  await db
    .prepare(
      `INSERT INTO profile_analytics_daily (profile_id, view_date, view_count)
       VALUES (?, ?, 1)
       ON CONFLICT(profile_id, view_date)
       DO UPDATE SET view_count = view_count + 1`,
    )
    .bind(profileId, viewDate)
    .run();
}

export async function getProfileAnalyticsSummary(
  db: D1Database,
  profileId: string,
): Promise<ProfileAnalyticsSummary> {
  const since30 = dateDaysAgo(29);
  const since7 = dateDaysAgo(6);

  const rows = await db
    .prepare(
      `SELECT view_date, view_count
       FROM profile_analytics_daily
       WHERE profile_id = ?
         AND view_date >= ?
       ORDER BY view_date ASC`,
    )
    .bind(profileId, since30)
    .all<{ view_date: string; view_count: number }>();

  const daily = rows.results ?? [];
  const totalViewsRow = await db
    .prepare(
      `SELECT COALESCE(SUM(view_count), 0) AS total
       FROM profile_analytics_daily
       WHERE profile_id = ?`,
    )
    .bind(profileId)
    .first<{ total: number }>();

  const viewsLast7Days = daily
    .filter((row) => row.view_date >= since7)
    .reduce((sum, row) => sum + row.view_count, 0);

  const viewsLast30Days = daily.reduce((sum, row) => sum + row.view_count, 0);

  return {
    profileId,
    totalViews: totalViewsRow?.total ?? 0,
    viewsLast7Days,
    viewsLast30Days,
    daily: daily.map((row) => ({
      date: row.view_date,
      views: row.view_count,
    })),
  };
}
