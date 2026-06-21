export type OAuthProvider = "instagram" | "tiktok";

export interface SocialLink {
  platform: OAuthProvider | "twitter" | "youtube" | "website";
  url: string;
  label: string;
}

export interface OAuthIdentityPayload {
  provider: OAuthProvider;
  subject: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface RegistrationPayload {
  username: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  oauth: OAuthIdentityPayload;
  socialLinks?: SocialLink[];
}

export interface UsernameCheckResult {
  username: string;
  available: boolean;
  locked: boolean;
  reason?: string;
}

export interface ProfilePublicView {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profileImageUrl: string | null;
  socialLinks: SocialLink[];
  instagramHandle: string | null;
  tiktokHandle: string | null;
  isVerified: boolean;
  isLocked: boolean;
}

export interface UploadTokenResponse {
  username: string;
  uploadToken: string;
  expiresAt: number;
  uploadUrl: string;
  maxBytes: number;
  allowedTypes: string[];
}

export interface UploadResponse {
  key: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
}
