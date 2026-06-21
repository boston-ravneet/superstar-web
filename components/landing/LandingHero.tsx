import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.25),_transparent_55%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl">
        <p className="mb-4 inline-flex items-center rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
          getsuperstar.info
        </p>
        <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl">
          Your stage.
          <span className="block bg-gradient-to-r from-fuchsia-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
            One link. Infinite reach.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Superstar App gives creators a public portfolio handle, verified social
          identity, and a neon-lit digital stage built for the serverless edge.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/demo"
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_40px_rgba(217,70,239,0.35)] transition hover:scale-[1.02]"
          >
            Explore a live stage
          </Link>
          <a
            href="#features"
            className="rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold text-zinc-200 transition hover:border-fuchsia-400/60 hover:text-white"
          >
            See platform features
          </a>
        </div>
      </div>
    </section>
  );
}
