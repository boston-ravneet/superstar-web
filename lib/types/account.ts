export type AccountAuthProvider = "apple" | "google";

export interface AccountRecord {
  id: string;
  email: string | null;
  display_name: string | null;
  auth_provider: AccountAuthProvider;
  auth_subject: string;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountPublicView {
  id: string;
  email: string | null;
  displayName: string | null;
  authProvider: AccountAuthProvider;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  requiresTermsAcceptance: boolean;
}

export interface AccountAuthResponse {
  account: AccountPublicView;
  sessionToken: string;
  expiresAt: number;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface AppleAuthPayload {
  identityToken: string;
  email?: string | null;
  fullName?: string | null;
}

export interface AccountProfileSummary {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  publishStatus: "draft" | "generating" | "preview" | "published";
  isVerified: boolean;
  isLocked: boolean;
  totalViews?: number;
  viewsLast7Days?: number;
}
