import type { ProfileBuilderInput } from "@/lib/types/stage-template";
import {
  extractEmailFromText,
  extractPhoneFromText,
  normalizePhoneForTel,
} from "@/lib/stage/extract-contact";
import {
  normalizeSocialAccounts,
  socialAccountDisplayHandle,
  socialAccountHref,
  SOCIAL_PLATFORM_LABELS,
  type SocialPlatform,
} from "@/lib/stage/social-accounts";

export type ConnectActionKind = SocialPlatform;

export interface ConnectAction {
  label: string;
  href: string;
  kind: ConnectActionKind;
}

function accountsForInput(input: ProfileBuilderInput) {
  const fromSaved = normalizeSocialAccounts(input.socialAccounts ?? []);
  if (fromSaved.length > 0) {
    return fromSaved;
  }

  const legacy = [];
  if (input.instagramHandle?.trim()) {
    legacy.push({
      platform: "instagram" as const,
      handle: input.instagramHandle,
    });
  }
  if (input.tiktokHandle?.trim()) {
    legacy.push({
      platform: "tiktok" as const,
      handle: input.tiktokHandle,
    });
  }

  return normalizeSocialAccounts(legacy);
}

export function resolveConnectActions(
  input: ProfileBuilderInput,
): ConnectAction[] {
  const actions: ConnectAction[] = [];
  const accounts = accountsForInput(input);

  for (const account of accounts) {
    const href = socialAccountHref(account.platform, account.handle);
    if (!href) {
      continue;
    }

    actions.push({
      label: SOCIAL_PLATFORM_LABELS[account.platform],
      href,
      kind: account.platform,
    });
  }

  const hasEmail = accounts.some((account) => account.platform === "email");
  const hasPhone = accounts.some((account) => account.platform === "phone");

  if (!hasEmail) {
    const email = extractEmailFromText(input.bio);
    if (email) {
      actions.push({
        label: "Email",
        href: `mailto:${email}?subject=Hello%20@${encodeURIComponent(input.username)}`,
        kind: "email",
      });
    }
  }

  if (!hasPhone) {
    const phone = extractPhoneFromText(input.bio);
    if (phone) {
      actions.push({
        label: "Call or text",
        href: `tel:${normalizePhoneForTel(phone)}`,
        kind: "phone",
      });
    }
  }

  return actions;
}

export function buildCtaContent(
  input: ProfileBuilderInput,
  fallbackLabel: string,
): {
  label: string;
  href: string;
  actions: ConnectAction[];
} {
  const actions = resolveConnectActions(input);

  if (actions.length === 0) {
    return {
      label: fallbackLabel,
      href: "",
      actions: [],
    };
  }

  const primary = actions[0];
  const accounts = accountsForInput(input);
  const primaryAccount = accounts.find(
    (account) => account.platform === primary.kind,
  );
  const labelByKind: Partial<Record<ConnectActionKind, string>> = {
    instagram: "Message on Instagram",
    tiktok: "Find me on TikTok",
    youtube: "Watch on YouTube",
    twitter: "Follow on X",
    linkedin: "Connect on LinkedIn",
    website: "Visit my website",
    email: "Send an email",
    phone: "Call or text",
  };

  const display = primaryAccount
    ? socialAccountDisplayHandle(primaryAccount.platform, primaryAccount.handle)
    : primary.label;

  return {
    label: labelByKind[primary.kind] ?? `Connect via ${display}`,
    href: primary.href,
    actions,
  };
}
