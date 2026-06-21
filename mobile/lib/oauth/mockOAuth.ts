import type { OAuthIdentityPayload, OAuthProvider } from "@/types/profile";

const MOCK_DELAY_MS = 900;

function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase().replace(/^@/, "");
}

function buildMockSubject(provider: OAuthProvider, handle: string): string {
  return `${provider}:${handle}:${Date.now()}`;
}

export async function mockOAuthHandshake(input: {
  provider: OAuthProvider;
  expectedHandle: string;
}): Promise<OAuthIdentityPayload> {
  const handle = normalizeHandle(input.expectedHandle);

  if (handle.length < 3) {
    throw new Error("Connect OAuth after choosing a valid handle.");
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  return {
    provider: input.provider,
    subject: buildMockSubject(input.provider, handle),
    handle,
    displayName: handle
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    avatarUrl: undefined,
  };
}
