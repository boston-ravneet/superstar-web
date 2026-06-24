import type { OAuthIdentityPayload } from "@/types/profile";
import type { ArchetypeId } from "@/constants/archetypes";
import type { SocialHandleDrafts } from "@/lib/social/accounts";
import { EMPTY_PORTFOLIO } from "@/lib/media/constants";

export interface OnboardingState {
  mode: "create" | "edit";
  username: string;
  displayName: string;
  bio: string;
  designInstructions: string;
  preferredArchetypeId: ArchetypeId | null;
  oauth: OAuthIdentityPayload | null;
  socialHandleDrafts: SocialHandleDrafts;
  profileId: string | null;
  headshotUri: string | null;
  headshotPublicUrl: string | null;
  showreelUrls: [string, string];
  portfolioUris: typeof EMPTY_PORTFOLIO;
  portfolioPublicUrls: typeof EMPTY_PORTFOLIO;
}

export const initialOnboardingState: OnboardingState = {
  mode: "create",
  username: "",
  displayName: "",
  bio: "",
  designInstructions: "",
  preferredArchetypeId: null,
  oauth: null,
  socialHandleDrafts: {},
  profileId: null,
  headshotUri: null,
  headshotPublicUrl: null,
  showreelUrls: ["", ""],
  portfolioUris: [...EMPTY_PORTFOLIO],
  portfolioPublicUrls: [...EMPTY_PORTFOLIO],
};

let onboardingState: OnboardingState = { ...initialOnboardingState };

export function getOnboardingState(): OnboardingState {
  return onboardingState;
}

export function patchOnboardingState(
  patch: Partial<OnboardingState>,
): OnboardingState {
  onboardingState = { ...onboardingState, ...patch };
  return onboardingState;
}

export function resetOnboardingState(): void {
  onboardingState = { ...initialOnboardingState };
}
