import type { ProfileBuilderInput } from "@/lib/types/stage-template";
import {
  extractEmailFromText,
  extractPhoneFromText,
  normalizePhoneForTel,
} from "@/lib/stage/extract-contact";

export type ConnectActionKind =
  | "email"
  | "phone"
  | "instagram"
  | "tiktok";

export interface ConnectAction {
  label: string;
  href: string;
  kind: ConnectActionKind;
}

export function resolveConnectActions(
  input: ProfileBuilderInput,
): ConnectAction[] {
  const actions: ConnectAction[] = [];
  const email = extractEmailFromText(input.bio);
  const phone = extractPhoneFromText(input.bio);

  if (input.instagramHandle?.trim()) {
    const handle = input.instagramHandle.replace(/^@/, "");
    actions.push({
      label: "Instagram",
      href: `https://instagram.com/${handle}`,
      kind: "instagram",
    });
  }

  if (input.tiktokHandle?.trim()) {
    const handle = input.tiktokHandle.replace(/^@/, "");
    actions.push({
      label: "TikTok",
      href: `https://tiktok.com/@${handle}`,
      kind: "tiktok",
    });
  }

  if (email) {
    actions.push({
      label: "Email",
      href: `mailto:${email}?subject=Hello%20@${encodeURIComponent(input.username)}`,
      kind: "email",
    });
  }

  if (phone) {
    actions.push({
      label: "Call or text",
      href: `tel:${normalizePhoneForTel(phone)}`,
      kind: "phone",
    });
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
  const labelByKind: Record<ConnectActionKind, string> = {
    instagram: "Message on Instagram",
    tiktok: "Find me on TikTok",
    email: "Send an email",
    phone: "Call or text",
  };

  return {
    label: labelByKind[primary.kind] ?? fallbackLabel,
    href: primary.href,
    actions,
  };
}
