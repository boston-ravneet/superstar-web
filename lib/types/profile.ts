export type OAuthProvider = "instagram" | "tiktok";

export interface SocialLink {
  platform: OAuthProvider | "twitter" | "youtube" | "website";
  url: string;
  label: string;
}

export interface ProfileRecord {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  social_links_json: string;
  is_verified: number;
  is_locked: number;
  profile_status: "active" | "reserved_by_system" | "suspended" | null;
  layout_config_json: string;
  stage_template_json?: string | null;
  published_stage_template_json?: string | null;
  publish_status?: import("@/lib/types/stage-template").PublishStatus | null;
  builder_input_json?: string | null;
  generation_error?: string | null;
  oauth_provider: OAuthProvider | null;
  oauth_subject: string | null;
  created_at: string;
  updated_at: string;
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

export interface ApiErrorBody {
  error: string;
  code: string;
}

export interface UploadResponse {
  key: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
}
