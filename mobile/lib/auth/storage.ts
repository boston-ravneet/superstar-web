import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "superstar.account.session";
const ACCOUNT_KEY = "superstar.account.profile";

export interface StoredAccountSession {
  sessionToken: string;
  expiresAt: number;
  account: import("@/types/account").AccountPublicView;
}

export async function saveAccountSession(
  session: StoredAccountSession,
): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, session.sessionToken);
  await SecureStore.setItemAsync(ACCOUNT_KEY, JSON.stringify(session));
}

export async function loadAccountSession(): Promise<StoredAccountSession | null> {
  const raw = await SecureStore.getItemAsync(ACCOUNT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAccountSession;
    if (Date.now() > parsed.expiresAt) {
      await clearAccountSession();
      return null;
    }
    return parsed;
  } catch {
    await clearAccountSession();
    return null;
  }
}

export async function clearAccountSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(ACCOUNT_KEY);
}

export async function getSessionToken(): Promise<string | null> {
  const session = await loadAccountSession();
  return session?.sessionToken ?? null;
}
