import Link from "next/link";

interface AvailableHandleProps {
  username: string;
}

export function AvailableHandlePage({ username }: AvailableHandleProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950/80 p-10 text-center shadow-[0_0_60px_rgba(168,85,247,0.12)]">
        <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-300">
          Handle available
        </p>
        <h1 className="mt-4 text-4xl font-black">@{username}</h1>
        <p className="mt-4 text-zinc-400">
          This stage is open. Claim it through the Superstar mobile onboarding
          flow with a verified Instagram or TikTok identity.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Back to Superstar App
        </Link>
      </div>
    </div>
  );
}
