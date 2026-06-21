import type { Metadata } from "next";
import { StageTemplateRenderer } from "@/components/stage/StageTemplateRenderer";
import { getWebBaseFromHeaders } from "@/lib/api/web-base";
import { getBindings } from "@/lib/cloudflare/env";
import { getStageProfileByUsername } from "@/lib/db/profiles";
import { rewriteMediaUrlsInTemplate } from "@/lib/media/urls";
import { validateUsernameFormat } from "@/lib/validation/username";

interface PreviewPageProps {
  params: Promise<{ artistname: string }>;
}

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { artistname } = await params;
  const validation = validateUsernameFormat(artistname);

  return {
    title: validation.valid
      ? `Preview @${validation.normalized} | Superstar App`
      : "Preview | Superstar App",
    robots: { index: false, follow: false },
  };
}

export default async function PreviewProfilePage({ params }: PreviewPageProps) {
  const { artistname } = await params;
  const validation = validateUsernameFormat(artistname);

  if (!validation.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <p>Invalid handle.</p>
      </div>
    );
  }

  const { DB } = await getBindings();
  const profile = await getStageProfileByUsername(DB, validation.normalized);

  if (!profile?.stageTemplate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Preview not ready</h1>
          <p className="mt-3 text-zinc-400">
            Your stage design is still being built. Check back in the app shortly.
          </p>
        </div>
      </div>
    );
  }

  return <StageTemplateRenderer template={rewriteMediaUrlsInTemplate(profile.stageTemplate, await getWebBaseFromHeaders())} preview />;
}
