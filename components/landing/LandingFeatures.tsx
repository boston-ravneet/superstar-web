const FEATURES = [
  {
    title: "Edge-native profiles",
    body: "Public handles resolve on Cloudflare Workers with D1-backed identity and sub-50ms global delivery.",
  },
  {
    title: "Verified onboarding",
    body: "Instagram and TikTok OAuth handles must match your chosen username to block impersonation and squatting.",
  },
  {
    title: "Media at the edge",
    body: "Profile assets land in R2 with signed upload tokens and immutable CDN-friendly cache headers.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-zinc-900 px-6 py-20">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <h2 className="text-lg font-bold text-white">{feature.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {feature.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
