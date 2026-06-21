import Image from "next/image";
import type { ReactNode } from "react";
import type { StageProfileView } from "@/lib/types/stage";
import type { StageThemeClasses } from "@/lib/stage/theme-styles";

function ProfileAvatar({
  src,
  alt,
  initials,
}: {
  src: string | null;
  alt: string;
  initials: string;
}) {
  if (src?.startsWith("http://")) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
      />
    );
  }

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="128px"
        priority
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-3xl font-black tracking-tight text-zinc-100">
      {initials}
    </div>
  );
}

function PremiumGoldBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-amber-300" aria-hidden>
        <path d="M10 1.5l2.2 4.5 4.9.7-3.55 3.46.84 4.88L10 12.9l-4.39 2.15.84-4.88L2.9 6.7l4.9-.7L10 1.5z" />
      </svg>
      Premium Reserved
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/35 bg-gradient-to-r from-sky-500/15 to-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.18)]">
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-sky-300" aria-hidden>
        <path d="M16.7 5.3 8.5 13.5 4.3 9.3l1.4-1.4 2.8 2.8 6.8-6.8 1.4 1.4z" />
      </svg>
      Verified
    </span>
  );
}

function CommunityBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
      Community Account
    </span>
  );
}

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/80 text-zinc-100 transition hover:border-fuchsia-500/40 hover:bg-zinc-900 hover:text-white"
    >
      {children}
    </a>
  );
}

export function StageHeroHeader({
  profile,
  theme,
}: {
  profile: StageProfileView;
  theme: StageThemeClasses;
}) {
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8 sm:pt-14">
      <div className={`pointer-events-none absolute inset-0 ${theme.heroGlow}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_20px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] ring-2 ring-amber-500/15 sm:h-36 sm:w-36">
          <ProfileAvatar
            src={profile.profileImageUrl}
            alt={`${profile.displayName} avatar`}
            initials={initials}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          @{profile.username}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            {profile.displayName}
          </h1>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {profile.isLocked ? (
            <PremiumGoldBadge />
          ) : profile.isVerified ? (
            <VerifiedBadge />
          ) : (
            <CommunityBadge />
          )}
        </div>

        {profile.bio ? (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            {profile.bio}
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          {profile.instagramHandle ? (
            <SocialIconLink
              href={`https://instagram.com/${profile.instagramHandle}`}
              label={`Instagram @${profile.instagramHandle}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.3.4.6.2 1 .5 1.5 1 .5.5.8.9 1 1.5.2.4.4 1.1.5 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.5 2.3-.2.6-.5 1-1 1.5-.5.5-.9.8-1.5 1-.4.2-1.1.4-2.3.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.3-.5-.6-.2-1-.5-1.5-1-.5-.5-.8-.9-1-1.5-.2-.4-.4-1.1-.5-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.9.5-2.3.2-.6.5-1 1-1.5.5-.5.9-.8 1.5-1 .4-.2 1.1-.4 2.3-.5C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.7-.3.3-.5.7-.7 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.7 1.2.3.3.7.5 1.2.7.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.7.3-.3.5-.7.7-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.7-1.2-.3-.3-.7-.5-1.2-.7-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm0 1.8a3.7 3.7 0 100 7.4 3.7 3.7 0 000-7.4zm5.8-2.4a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6z" />
              </svg>
            </SocialIconLink>
          ) : null}

          {profile.tiktokHandle ? (
            <SocialIconLink
              href={`https://tiktok.com/@${profile.tiktokHandle}`}
              label={`TikTok @${profile.tiktokHandle}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M16.5 3c.4 2.2 1.7 4.2 3.7 5.4V12c-1.3 0-2.6-.4-3.7-1.1v6.8c0 3.4-2.8 6.2-6.2 6.2S4.1 21.1 4.1 17.7s2.8-6.2 6.2-6.2c.3 0 .7 0 1 .1v3.4c-.3-.1-.6-.2-1-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V3h3.4z" />
              </svg>
            </SocialIconLink>
          ) : null}
        </div>
      </div>
    </header>
  );
}
