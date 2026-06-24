import type { SocialLinksPayload } from "@/lib/types/stage";
import { parseSocialLinksPayload } from "@/lib/stage/parse-social-links";
import { serializeSocialLinksPayload } from "@/lib/stage/serialize-social-links";

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
  verifiedAt?: string;
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

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X",
  linkedin: "LinkedIn",
  website: "Website",
  email: "Email",
  phone: "Phone",
};

const PLATFORM_SET = new Set<SocialPlatform>(SOCIAL_PLATFORM_ORDER);

export function isSocialPlatform(value: string): value is SocialPlatform {
  return PLATFORM_SET.has(value as SocialPlatform);
}

export function normalizeSocialHandle(
  platform: SocialPlatform,
  raw: string,
): string {
  let value = raw.trim();
  if (!value) {
    return "";
  }

  if (platform === "email") {
    return value.toLowerCase();
  }

  if (platform === "phone") {
    return value.replace(/[^\d+().-\s]/g, "").trim();
  }

  if (platform === "website") {
    if (!/^https?:\/\//i.test(value)) {
      value = `https://${value}`;
    }
    return value;
  }

  if (platform === "youtube") {
    value = value.replace(/^https?:\/\/(www\.)?youtube\.com\//i, "");
    value = value.replace(/^@/, "");
    if (value.startsWith("channel/") || value.startsWith("c/") || value.startsWith("@")) {
      return value;
    }
    return value.replace(/^@/, "");
  }

  if (platform === "linkedin") {
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    return value.replace(/^@/, "");
  }

  return value.replace(/^@/, "").trim();
}

export function socialAccountHref(
  platform: SocialPlatform,
  handle: string,
): string {
  const normalized = normalizeSocialHandle(platform, handle);
  if (!normalized) {
    return "";
  }

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${normalized}`;
    case "tiktok":
      return `https://tiktok.com/@${normalized}`;
    case "youtube":
      if (/^https?:\/\//i.test(normalized)) {
        return normalized;
      }
      if (normalized.startsWith("channel/") || normalized.startsWith("c/")) {
        return `https://youtube.com/${normalized}`;
      }
      return `https://youtube.com/@${normalized}`;
    case "twitter":
      return `https://x.com/${normalized.replace(/^@/, "")}`;
    case "linkedin":
      if (/^https?:\/\//i.test(normalized)) {
        return normalized;
      }
      return `https://linkedin.com/in/${normalized}`;
    case "website":
      return normalized;
    case "email":
      return `mailto:${normalized}`;
    case "phone": {
      const digits = normalized.replace(/[^\d+]/g, "");
      return digits ? `tel:${digits}` : "";
    }
    default:
      return normalized;
  }
}

export function socialAccountDisplayHandle(
  platform: SocialPlatform,
  handle: string,
): string {
  const normalized = normalizeSocialHandle(platform, handle);
  if (!normalized) {
    return "";
  }

  if (platform === "website" || platform === "linkedin") {
    return normalized.replace(/^https?:\/\/(www\.)?/, "");
  }

  if (platform === "email" || platform === "phone") {
    return normalized;
  }

  return `@${normalized.replace(/^@/, "")}`;
}

export function normalizeSocialAccounts(
  accounts: Array<Partial<SocialAccount> | null | undefined>,
): SocialAccount[] {
  const seen = new Set<SocialPlatform>();
  const result: SocialAccount[] = [];

  for (const entry of accounts) {
    if (!entry?.platform || !isSocialPlatform(entry.platform)) {
      continue;
    }

    const handle = normalizeSocialHandle(entry.platform, String(entry.handle ?? ""));
    if (!handle || seen.has(entry.platform)) {
      continue;
    }

    seen.add(entry.platform);
    result.push({
      platform: entry.platform,
      handle,
      verified: Boolean(entry.verified),
      verifiedAt:
        typeof entry.verifiedAt === "string" ? entry.verifiedAt : undefined,
    });
  }

  return SOCIAL_PLATFORM_ORDER.filter((platform) =>
    result.some((account) => account.platform === platform),
  ).map(
    (platform) => result.find((account) => account.platform === platform)!,
  );
}

export function parseSocialAccountsFromJson(
  raw: string | null | undefined,
): SocialAccount[] {
  const payload = parseSocialLinksPayload(raw ?? null);
  if (payload.accounts?.length) {
    return normalizeSocialAccounts(payload.accounts);
  }

  const legacy = (payload.links ?? [])
    .map((link): SocialAccount | null => {
      if (!isSocialPlatform(link.platform)) {
        return null;
      }

      const handle =
        link.platform === "website"
          ? link.url
          : link.label.replace(/^@/, "") || link.url.split("/").pop() || "";

      return {
        platform: link.platform,
        handle,
        verified: false,
      };
    })
    .filter((entry): entry is SocialAccount => entry !== null);

  return normalizeSocialAccounts(legacy);
}

export function legacyHandlesFromAccounts(accounts: SocialAccount[]): {
  instagramHandle: string | null;
  tiktokHandle: string | null;
} {
  const instagram = accounts.find((account) => account.platform === "instagram");
  const tiktok = accounts.find((account) => account.platform === "tiktok");

  return {
    instagramHandle: instagram?.handle ?? null,
    tiktokHandle: tiktok?.handle ?? null,
  };
}

export function accountsFromLegacyHandles(
  instagramHandle?: string | null,
  tiktokHandle?: string | null,
): SocialAccount[] {
  const accounts: SocialAccount[] = [];

  if (instagramHandle?.trim()) {
    accounts.push({
      platform: "instagram",
      handle: normalizeSocialHandle("instagram", instagramHandle),
      verified: false,
    });
  }

  if (tiktokHandle?.trim()) {
    accounts.push({
      platform: "tiktok",
      handle: normalizeSocialHandle("tiktok", tiktokHandle),
      verified: false,
    });
  }

  return normalizeSocialAccounts(accounts);
}

export function mergeSocialAccountSources(input: {
  socialLinksJson?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  socialAccounts?: SocialAccount[] | null;
}): SocialAccount[] {
  const fromJson = parseSocialAccountsFromJson(input.socialLinksJson ?? null);
  if (fromJson.length > 0) {
    return fromJson;
  }

  if (input.socialAccounts?.length) {
    return normalizeSocialAccounts(input.socialAccounts);
  }

  return accountsFromLegacyHandles(
    input.instagramHandle,
    input.tiktokHandle,
  );
}

export function serializeSocialAccountsPayload(
  accounts: SocialAccount[],
): string {
  const normalized = normalizeSocialAccounts(accounts);
  const payload: SocialLinksPayload = {
    accounts: normalized,
  };
  return serializeSocialLinksPayload([], payload);
}

export function socialAccountsToBuilderHandles(accounts: SocialAccount[]): {
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
} {
  const legacy = legacyHandlesFromAccounts(accounts);
  return {
    instagramHandle: legacy.instagramHandle,
    tiktokHandle: legacy.tiktokHandle,
  };
}

export type SocialAccountDrafts = Partial<Record<SocialPlatform, string>>;

export function draftsFromSocialAccounts(
  accounts: SocialAccount[],
): SocialAccountDrafts {
  const drafts: SocialAccountDrafts = {};
  for (const account of accounts) {
    drafts[account.platform] = account.handle;
  }
  return drafts;
}

export function socialAccountsFromDrafts(
  drafts: SocialAccountDrafts,
): SocialAccount[] {
  return normalizeSocialAccounts(
    SOCIAL_PLATFORM_ORDER.map((platform) => ({
      platform,
      handle: drafts[platform] ?? "",
      verified: false,
    })),
  );
}
