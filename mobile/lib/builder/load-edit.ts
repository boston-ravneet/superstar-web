import { fetchBuilderStatus } from "@/lib/api/client";
import type { ArchetypeId } from "@/constants/archetypes";
import { ARCHETYPE_OPTIONS } from "@/constants/archetypes";
import { mediaStateFromBuilderInput } from "@/lib/media/build-payload";
import { draftsFromAccounts } from "@/lib/social/accounts";
import {
  initialOnboardingState,
  patchOnboardingState,
} from "@/lib/state/onboarding";

const ARCHETYPE_IDS = new Set<ArchetypeId>(
  ARCHETYPE_OPTIONS.map((option) => option.id),
);

function parsePreferredArchetypeId(value: unknown): ArchetypeId | null {
  return typeof value === "string" && ARCHETYPE_IDS.has(value as ArchetypeId)
    ? (value as ArchetypeId)
    : null;
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
    preferredArchetypeId: parsePreferredArchetypeId(input.preferredArchetypeId),
    oauth: null,
    ...mediaState,
  });
}
