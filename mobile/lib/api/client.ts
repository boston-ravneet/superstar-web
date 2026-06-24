const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.body && !headers.has("Content-Type") && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(
      `Network request failed. Ensure the web server is running and EXPO_PUBLIC_API_URL (${API_BASE_URL}) is reachable from your device.`,
    );
  }

  const payload = (await response.json()) as T & { error?: string; code?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

export async function checkUsername(username: string) {
  return request<import("@/types/profile").UsernameCheckResult>(
    `/api/profile/check?username=${encodeURIComponent(username)}`,
  );
}

export async function loginWithGoogle(idToken: string) {
  return request<import("@/types/account").AccountAuthResponse>("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export async function loginWithApple(input: {
  identityToken: string;
  email?: string | null;
  fullName?: string | null;
}) {
  return request<import("@/types/account").AccountAuthResponse>("/api/auth/apple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function loginWithDev(input: {
  provider?: "apple" | "google";
  email?: string;
  displayName?: string;
}) {
  return request<import("@/types/account").AccountAuthResponse>("/api/auth/dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function fetchMyProfiles(sessionToken: string) {
  return request<{ profiles: import("@/types/account").AccountProfileSummary[] }>(
    "/api/account/profiles",
    { method: "GET" },
    sessionToken,
  );
}

export async function registerProfile(
  payload: import("@/types/profile").RegistrationPayload,
  sessionToken: string,
) {
  return request<{ profile: import("@/types/profile").ProfilePublicView }>(
    "/api/profile",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    sessionToken,
  );
}

export async function requestUploadToken(username: string) {
  return request<import("@/types/profile").UploadTokenResponse>(
    `/api/upload?username=${encodeURIComponent(username)}`,
  );
}

export async function uploadProfileImage(input: {
  username: string;
  uploadToken: string;
  uri: string;
  mimeType: string;
  fileName: string;
}) {
  const formData = new FormData();
  formData.append("username", input.username);
  formData.append("uploadToken", input.uploadToken);
  formData.append(
    "file",
    {
      uri: input.uri,
      name: input.fileName,
      type: input.mimeType,
    } as unknown as Blob,
  );

  return request<import("@/types/profile").UploadResponse>("/api/upload", {
    method: "POST",
    body: formData,
  });
}

export function getPublicProfileUrl(username: string): string {
  const webBase =
    process.env.EXPO_PUBLIC_WEB_URL ?? "https://getsuperstar.info";
  return `${webBase}/${encodeURIComponent(username)}`;
}

export function getPreviewProfileUrl(username: string): string {
  const webBase =
    process.env.EXPO_PUBLIC_WEB_URL ?? "https://getsuperstar.info";
  return `${webBase}/preview/${encodeURIComponent(username)}`;
}

export async function submitProfileBuilder(
  payload: {
    profileId: string;
    bio: string;
    designInstructions?: string;
    extraDetails?: string;
    imageUrls: string[];
    media?: import("@/lib/media/build-payload").BuilderMediaPayload;
    preferredArchetypeId?: string;
    socialAccounts?: import("@/lib/social/accounts").SocialAccount[];
  },
  sessionToken: string,
) {
  return request<{
    profileId: string;
    username: string;
    publishStatus: string;
    generationSource?: string;
    generationError?: string | null;
    estimatedMinutes: number;
    message: string;
  }>(
    "/api/profile/builder/submit",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    sessionToken,
  );
}

export async function fetchBuilderStatus(profileId: string, sessionToken: string) {
  return request<{
    profileId: string;
    username: string;
    displayName: string;
    publishStatus: string;
    generationError: string | null;
    bioDisplayMode?: "polished" | "original";
    originalBio?: string;
    recentGenerationLogs?: Array<{
      at: string;
      event: string;
      detail?: Record<string, unknown>;
    }>;
    template: unknown | null;
    builderInput: {
      bio: string;
      designInstructions?: string;
      extraDetails?: string;
      imageUrls: string[];
      media?: import("@/lib/media/build-payload").BuilderMediaPayload;
      displayName: string;
      username: string;
      socialAccounts?: import("@/lib/social/accounts").SocialAccount[];
    } | null;
    previewUrl: string | null;
    publicUrl: string | null;
    analytics?: {
      totalViews: number;
      viewsLast7Days: number;
      viewsLast30Days: number;
      daily: Array<{ date: string; views: number }>;
    } | null;
  }>(
    `/api/profile/builder/status?profileId=${encodeURIComponent(profileId)}`,
    { method: "GET" },
    sessionToken,
  );
}

export async function refineProfileBuilder(
  payload: { profileId: string; prompt: string },
  sessionToken: string,
) {
  return request<{
    profileId: string;
    publishStatus: string;
    generationSource?: string;
    generationError?: string | null;
    template: unknown | null;
  }>(
    "/api/profile/builder/refine",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    sessionToken,
  );
}

export async function setBioDisplayMode(
  profileId: string,
  useOriginalBio: boolean,
  sessionToken: string,
) {
  return request<{
    profileId: string;
    bioDisplayMode: "polished" | "original";
    useOriginalBio: boolean;
  }>(
    "/api/profile/builder/bio-source",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, useOriginalBio }),
    },
    sessionToken,
  );
}

export async function publishProfileBuilder(
  profileId: string,
  sessionToken: string,
) {
  return request<{
    profileId: string;
    username: string;
    publishStatus: string;
    publicUrl: string | null;
  }>(
    "/api/profile/builder/publish",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    },
    sessionToken,
  );
}
