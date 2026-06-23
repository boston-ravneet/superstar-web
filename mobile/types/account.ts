export type AccountAuthProvider = "apple" | "google";

export interface AccountPublicView {
  id: string;
  email: string | null;
  displayName: string | null;
  authProvider: AccountAuthProvider;
}

export interface AccountAuthResponse {
  account: AccountPublicView;
  sessionToken: string;
  expiresAt: number;
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
