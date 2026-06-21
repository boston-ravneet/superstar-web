import type { SocialLink } from "@/lib/types/profile";

interface SocialStreamProps {
  links: SocialLink[];
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
}

function platformAccent(platform: SocialLink["platform"]): string {
  switch (platform) {
    case "instagram":
      return "from-pink-500 to-purple-600";
    case "tiktok":
      return "from-cyan-400 to-fuchsia-500";
    case "twitter":
      return "from-sky-400 to-blue-600";
    case "youtube":
      return "from-red-500 to-orange-500";
    default:
      return "from-zinc-500 to-zinc-700";
  }
}

export function SocialStream({
  links,
  instagramHandle,
  tiktokHandle,
}: SocialStreamProps) {
  const derivedLinks: SocialLink[] = [...links];

  if (instagramHandle) {
    derivedLinks.unshift({
      platform: "instagram",
      label: `@${instagramHandle}`,
      url: `https://instagram.com/${instagramHandle}`,
    });
  }

  if (tiktokHandle) {
    derivedLinks.unshift({
      platform: "tiktok",
      label: `@${tiktokHandle}`,
      url: `https://tiktok.com/@${tiktokHandle}`,
    });
  }

  const uniqueLinks = derivedLinks.filter(
    (link, index, array) =>
      array.findIndex((entry) => entry.url === link.url) === index,
  );

  if (uniqueLinks.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-500">
        No social stream modules connected yet.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Social Stream
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {uniqueLinks.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 transition hover:border-fuchsia-500/40"
          >
            <div
              className={`mb-3 inline-flex rounded-full bg-gradient-to-r ${platformAccent(link.platform)} px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white`}
            >
              {link.platform}
            </div>
            <p className="font-medium text-white group-hover:text-fuchsia-200">
              {link.label}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
