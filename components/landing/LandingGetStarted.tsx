import Link from "next/link";
import { SuperstarLogoFull } from "@/components/brand/SuperstarLogo";

export function LandingGetStarted() {
  return (
    <section
      id="get-started"
      className="border-t border-neutral-200 bg-neutral-50 px-6 py-20 sm:px-10 sm:py-28"
    >
      <div className="mx-auto max-w-3xl text-center">
        <SuperstarLogoFull size={120} className="mx-auto" />
        <h2 className="mt-8 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Claim your handle today
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-neutral-600">
          Handles are checked on the web. Download the Superstar app to sign in,
          claim your username, and publish your page.
        </p>
        <Link
          href="/app"
          className="mt-8 inline-flex rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Get the mobile app
        </Link>
        <p className="mt-10 text-sm font-medium text-neutral-500">
          iOS &amp; Android — coming to the App Store &amp; Google Play
        </p>
      </div>
    </section>
  );
}
