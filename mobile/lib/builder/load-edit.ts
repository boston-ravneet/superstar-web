import { fetchBuilderStatus } from "@/lib/api/client";
import {
  initialOnboardingState,
  patchOnboardingState,
} from "@/lib/state/onboarding";

function toImageTuple(urls: string[]): [
  string | null,
  string | null,
  string | null,
] {
  return [urls[0] ?? null, urls[1] ?? null, urls[2] ?? null];
}

export async function loadProfileForEdit(
  profileId: string,
  sessionToken: string,
): Promise<void> {
  const status = await fetchBuilderStatus(profileId, sessionToken);
  const input = status.builderInput;

  if (!input) {
    throw new Error("Unable to load this stage for editing.");
  }

  const imageTuple = toImageTuple(input.imageUrls);

  patchOnboardingState({
    ...initialOnboardingState,
    mode: "edit",
    profileId,
    username: status.username,
    displayName: status.displayName ?? status.username,
    bio: input.bio,
    designInstructions: input.designInstructions ?? (input as { extraDetails?: string }).extraDetails ?? "",
    oauth: null,
    imageUris: imageTuple,
    imagePublicUrls: imageTuple,
  });
}
