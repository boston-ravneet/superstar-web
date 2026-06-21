import Image from "next/image";
import type { ProfilePublicView } from "@/lib/types/profile";
import { SocialStream } from "@/components/profile/SocialStream";
import { VerificationBanner } from "@/components/profile/VerificationBanner";

interface ProfileViewProps {
  profile: ProfilePublicView;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-black text-white">
      {!profile.isVerified && <VerificationBanner />}

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col items-center text-center">
          <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border border-fuchsia-500/40 bg-zinc-900 shadow-[0_0_40px_rgba(217,70,239,0.25)]">
            {profile.profileImageUrl ? (
              <Image
                src={profile.profileImageUrl}
                alt={`${profile.displayName} profile`}
                fill
                className="object-cover"
                sizes="128px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-600 to-purple-800 text-3xl font-bold">
                {initials}
              </div>
            )}
          </div>

          <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-300">
            @{profile.username}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            {profile.displayName}
          </h1>
          {profile.bio ? (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
              {profile.bio}
            </p>
          ) : null}
        </header>

        <SocialStream
          links={profile.socialLinks}
          instagramHandle={profile.instagramHandle}
          tiktokHandle={profile.tiktokHandle}
        />
      </main>
    </div>
  );
}
