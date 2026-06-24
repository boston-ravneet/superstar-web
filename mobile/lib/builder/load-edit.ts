import { fetchBuilderStatus } from "@/lib/api/client";
import { mediaStateFromBuilderInput } from "@/lib/media/build-payload";
import { draftsFromAccounts } from "@/lib/social/accounts";
import {
  initialOnboardingState,
  patchOnboardingState,
} from "@/lib/state/onboarding";

export async function loadProfileForEdit(
  profileId: string,
  sessionToken: string,
): Promise<void> {
  const status = await fetchBuilderStatus(profileId, sessionToken);
  const input = status.builderInput;

  if (!input) {
    throw new Error("Unable to load this stage for editing.");
  }

  const mediaState = mediaStateFromBuilderInput(input);

  patchOnboardingState({
    ...initialOnboardingState,
    mode: "edit",
    profileId,
    username: status.username,
    displayName: status.displayName ?? status.username,
    bio: input.bio,
    designInstructions:
      input.designInstructions ??
      (input as { extraDetails?: string }).extraDetails ??
      "",
    socialHandleDrafts: draftsFromAccounts(input.socialAccounts ?? []),
    oauth: null,
    ...mediaState,
  });
}
