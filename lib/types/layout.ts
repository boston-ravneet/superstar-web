export type ThemeTemplate =
  | "midnight-gold"
  | "neon-fuchsia"
  | "clean-slate"
  | "cinema-noir";

export interface LayoutShowreelInput {
  url: string;
  title?: string;
  posterUrl?: string;
}

export interface LayoutGalleryInput {
  url: string;
  caption?: string;
}

export interface LayoutConfig {
  theme_template: ThemeTemplate;
  showreel_videos: LayoutShowreelInput[];
  gallery_urls: LayoutGalleryInput[];
  skill_tags: string[];
  booking_label?: string;
  booking_href?: string;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  theme_template: "midnight-gold",
  showreel_videos: [],
  gallery_urls: [],
  skill_tags: [],
};

export interface ProfileUpdatePayload {
  userId: string;
  sessionToken: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  layout_config: LayoutConfig;
}

export interface SessionLoginPayload {
  userId: string;
  username: string;
}

export interface SessionLoginResponse {
  userId: string;
  username: string;
  sessionToken: string;
  expiresAt: number;
}

export interface ProfileUpdateResponse {
  profile: import("@/lib/types/stage").StageProfileView;
}
