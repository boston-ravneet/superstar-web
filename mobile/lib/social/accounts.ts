export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "website"
  | "email"
  | "phone";

export interface SocialAccount {
  platform: SocialPlatform;
  handle: string;
  verified?: boolean;
}

export interface SocialPlatformField {
  platform: SocialPlatform;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences";
}

export const SOCIAL_PLATFORM_ORDER: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "linkedin",
  "website",
  "email",
  "phone",
];

export const SOCIAL_PLATFORM_FIELDS: SocialPlatformField[] = [
  {
    platform: "instagram",
    label: "Instagram",
    placeholder: "handle (without @)",
    autoCapitalize: "none",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    placeholder: "handle (without @)",
    autoCapitalize: "none",
  },
  {
    platform: "youtube",
    label: "YouTube",
    placeholder: "channel or @handle",
    autoCapitalize: "none",
  },
  {
    platform: "twitter",
    label: "X (Twitter)",
    placeholder: "handle (without @)",
    autoCapitalize: "none",
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    placeholder: "username or profile URL",
    autoCapitalize: "none",
  },
  {
    platform: "website",
    label: "Website",
    placeholder: "yoursite.com",
    keyboardType: "url",
    autoCapitalize: "none",
  },
  {
    platform: "email",
    label: "Email",
    placeholder: "you@example.com",
    keyboardType: "email-address",
    autoCapitalize: "none",
  },
  {
    platform: "phone",
    label: "Phone",
    placeholder: "+1 555 123 4567",
    keyboardType: "phone-pad",
  },
];

function normalizeHandle(platform: SocialPlatform, raw: string): string {
  const value = raw.trim();
  if (!value) {
    return "";
  }

  if (platform === "email") {
    return value.toLowerCase();
  }

  if (platform === "website" && !/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }

  if (platform === "linkedin" && /^https?:\/\//i.test(value)) {
    return value;
  }

  if (platform === "phone") {
    return value;
  }

  return value.replace(/^@/, "");
}

export type SocialHandleDrafts = Partial<Record<SocialPlatform, string>>;

export function socialAccountsFromDrafts(
  drafts: SocialHandleDrafts,
): SocialAccount[] {
  return SOCIAL_PLATFORM_ORDER.map((platform) => ({
    platform,
    handle: normalizeHandle(platform, drafts[platform] ?? ""),
    verified: false,
  })).filter((account) => Boolean(account.handle));
}

export function draftsFromAccounts(accounts: SocialAccount[]): SocialHandleDrafts {
  const drafts: SocialHandleDrafts = {};
  for (const account of accounts) {
    drafts[account.platform] = account.handle;
  }
  return drafts;
}

export function patchSocialDraft(
  drafts: SocialHandleDrafts,
  platform: SocialPlatform,
  value: string,
): SocialHandleDrafts {
  return { ...drafts, [platform]: value };
}
