interface GoogleTokenInfo {
  sub: string;
  email?: string;
  name?: string;
  aud?: string;
  email_verified?: string;
}

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string | null;
  displayName: string | null;
}

export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId?: string,
): Promise<VerifiedGoogleIdentity> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );

  if (!response.ok) {
    throw new Error("Google identity token could not be verified.");
  }

  const payload = (await response.json()) as GoogleTokenInfo;

  if (!payload.sub) {
    throw new Error("Google token is missing subject.");
  }

  if (expectedClientId && payload.aud !== expectedClientId) {
    throw new Error("Google token audience mismatch.");
  }

  return {
    subject: payload.sub,
    email: payload.email ?? null,
    displayName: payload.name ?? null,
  };
}

interface AppleIdentityClaims {
  sub: string;
  email?: string;
}

function decodeJwtPayload(token: string): AppleIdentityClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Apple identity token is malformed.");
  }

  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
  const decoded = atob(padded);
  return JSON.parse(decoded) as AppleIdentityClaims;
}

export interface VerifiedAppleIdentity {
  subject: string;
  email: string | null;
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  fallbackEmail?: string | null,
): Promise<VerifiedAppleIdentity> {
  const claims = decodeJwtPayload(identityToken);

  if (!claims.sub) {
    throw new Error("Apple token is missing subject.");
  }

  return {
    subject: claims.sub,
    email: claims.email ?? fallbackEmail ?? null,
  };
}
