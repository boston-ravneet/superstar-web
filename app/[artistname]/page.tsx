import type { Metadata } from "next";
import { AvailableHandlePage } from "@/components/profile/AvailableHandlePage";
import { MediaVault } from "@/components/stage/MediaVault";
import { SkillsActionHub } from "@/components/stage/SkillsActionHub";
import { StageHeroHeader } from "@/components/stage/StageHeroHeader";
import { StageTemplateRenderer } from "@/components/stage/StageTemplateRenderer";
import { getWebBaseFromHeaders } from "@/lib/api/web-base";
import { getBindings } from "@/lib/cloudflare/env";
import { getStageProfileByUsername } from "@/lib/db/profiles";
import { rewriteMediaUrlsInTemplate } from "@/lib/media/urls";
import { getStageTheme } from "@/lib/stage/theme-styles";
import { validateUsernameFormat } from "@/lib/validation/username";

interface ArtistPageProps {
  params: Promise<{ artistname: string }>;
}

export async function generateMetadata({
  params,
}: ArtistPageProps): Promise<Metadata> {
  const { artistname } = await params;
  const validation = validateUsernameFormat(artistname);

  if (!validation.valid) {
    return {
      title: "Superstar App",
      description: "Creator portfolio stage on getsuperstar.info",
    };
  }

  try {
    const { DB } = await getBindings();
    const profile = await getStageProfileByUsername(DB, validation.normalized);

    if (!profile) {
      return {
        title: `@${validation.normalized} is available | Superstar App`,
        description: "Claim this public creator handle on getsuperstar.info",
      };
    }

    return {
      title: `${profile.displayName} (@${profile.username}) | Superstar App`,
      description:
        profile.bio ||
        `Official creator stage for @${profile.username} on getsuperstar.info`,
    };
  } catch {
    return {
      title: `@${validation.normalized} | Superstar App`,
      description: "Creator portfolio stage on getsuperstar.info",
    };
  }
}

function InvalidHandleState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <div className="max-w-lg rounded-[2rem] border border-zinc-800 bg-zinc-950/90 p-10 text-center">
        <h1 className="text-3xl font-black">Invalid handle</h1>
        <p className="mt-4 text-zinc-400">{message}</p>
      </div>
    </div>
  );
}

export default async function ArtistProfilePage({ params }: ArtistPageProps) {
  const { artistname } = await params;
  const validation = validateUsernameFormat(artistname);

  if (!validation.valid) {
    return <InvalidHandleState message={validation.error ?? "Invalid handle."} />;
  }

  try {
    const { DB } = await getBindings();
    const profile = await getStageProfileByUsername(DB, validation.normalized);

    if (!profile) {
      return <AvailableHandlePage username={validation.normalized} />;
    }

    if (profile.profileStatus === "suspended") {
      return (
        <InvalidHandleState message="This stage is currently suspended." />
      );
    }

    if (profile.publishStatus !== "published") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-black">@{profile.username} is being set up</h1>
            <p className="mt-3 text-zinc-400">
              This creator is still building their stage. Check back soon.
            </p>
          </div>
        </div>
      );
    }

    if (profile.liveStageTemplate) {
      const webBase = await getWebBaseFromHeaders();
      return (
        <StageTemplateRenderer
          template={rewriteMediaUrlsInTemplate(profile.liveStageTemplate, webBase)}
        />
      );
    }

    const theme = getStageTheme(profile.layoutConfig.theme_template);

    return (
      <div className={`min-h-screen ${theme.page}`} data-theme={profile.layoutConfig.theme_template}>
        <StageHeroHeader profile={profile} theme={theme} />
        <MediaVault
          videos={profile.videos}
          photos={profile.photos}
          theme={theme}
        />
        <SkillsActionHub
          skills={profile.skills}
          bookingContact={profile.bookingContact}
          username={profile.username}
          theme={theme}
        />
      </div>
    );
  } catch {
    return <AvailableHandlePage username={validation.normalized} />;
  }
}
