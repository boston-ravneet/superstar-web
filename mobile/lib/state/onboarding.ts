import type { OAuthIdentityPayload } from "@/types/profile";

export interface OnboardingState {
  mode: "create" | "edit";
  username: string;
  displayName: string;
  bio: string;
  designInstructions: string;
  oauth: OAuthIdentityPayload | null;
  profileId: string | null;
  imageUris: [string | null, string | null, string | null];
  imagePublicUrls: [string | null, string | null, string | null];
}

export const initialOnboardingState: OnboardingState = {
  mode: "create",
  username: "",
  displayName: "",
  bio: "",
  designInstructions: "",
  oauth: null,
  profileId: null,
  imageUris: [null, null, null],
  imagePublicUrls: [null, null, null],
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
