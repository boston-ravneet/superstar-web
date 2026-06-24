import Link from "next/link";
import { SuperstarLogoLink } from "@/components/brand/SuperstarLogo";

interface AppDownloadPageProps {
  searchParams: Promise<{ handle?: string }>;
}

export default async function AppDownloadPage({ searchParams }: AppDownloadPageProps) {
  const params = await searchParams;
  const handle = params.handle?.trim().toLowerCase().replace(/^@/, "") ?? "";

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-5 sm:px-10">
        <SuperstarLogoLink variant="mark-dark" size={36} />
      </header>

      <main className="mx-auto max-w-lg px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Get Superstar on your phone
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          Profiles are created in the mobile app — not on this website. The web
          is where your page lives after you publish; the app is where you build
          it.
        </p>

        {handle ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-medium text-emerald-800">
              Handle to claim in the app
            </p>
            <p className="mt-1 text-xl font-semibold text-emerald-900">
              @{handle}
            </p>
            <p className="mt-2 text-sm text-emerald-700">
              Your page will be at getsuperstar.info/{handle}
            </p>
          </div>
        ) : null}

        <ol className="mt-10 space-y-5 text-neutral-700">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              1
            </span>
            <div>
              <p className="font-semibold text-neutral-900">Download the app</p>
              <p className="mt-1 text-sm leading-relaxed">
                Superstar for iOS and Android is rolling out to the App Store and
                Google Play.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              2
            </span>
            <div>
              <p className="font-semibold text-neutral-900">Sign in & pick your handle</p>
              <p className="mt-1 text-sm leading-relaxed">
                {handle
                  ? `Choose @${handle} during signup if it's still available.`
                  : "Choose the username you want — like yourname on getsuperstar.info."}
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              3
            </span>
            <div>
              <p className="font-semibold text-neutral-900">Build & publish your page</p>
              <p className="mt-1 text-sm leading-relaxed">
                Add your bio and photos; AI designs your page. Share your link
                anywhere.
              </p>
            </div>
          </li>
        </ol>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            App stores
          </p>
          <p className="mt-3 text-base font-medium text-neutral-900">
            Coming soon to App Store & Google Play
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            We&apos;re finishing our first public release. Check back shortly or
            follow updates at getsuperstar.info.
          </p>
        </div>

        <Link
          href={handle ? `/?handle=${encodeURIComponent(handle)}#claim` : "/#claim"}
          className="mt-10 inline-flex text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← Back to check another handle
        </Link>
      </main>
    </div>
  );
}
