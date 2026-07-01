import Link from "next/link";
import { SuperstarLogoLink } from "@/components/brand/SuperstarLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Superstar collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-5 sm:px-10">
        <SuperstarLogoLink variant="mark-dark" size={36} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: June 24, 2026</p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-neutral-700">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Overview</h2>
            <p className="mt-3">
              Superstar (&quot;we&quot;, &quot;us&quot;) operates getsuperstar.info and the
              Superstar mobile app. This policy explains what we collect when you sign
              in, build a public page, or visit someone&apos;s stage. Use of the service
              is also governed by our{" "}
              <Link href="/terms" className="font-medium text-neutral-900 underline">
                Terms & Conditions
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Information we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-neutral-900">Account:</strong> When you sign in
                with Apple or Google, we receive your provider subject ID and, if shared,
                your name and email.
              </li>
              <li>
                <strong className="text-neutral-900">Profile content:</strong> Handle,
                display name, bio, photos, showreel links, social handles, and design
                preferences you submit in the app.
              </li>
              <li>
                <strong className="text-neutral-900">Usage:</strong> Anonymous page view
                counts for published stages (not tied to individual visitors&apos; identities).
              </li>
              <li>
                <strong className="text-neutral-900">Device:</strong> Standard app logs
                and crash diagnostics from Apple/Google distribution platforms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">How we use it</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Create and host your public page at getsuperstar.info/yourname</li>
              <li>Authenticate your account and manage multiple handles</li>
              <li>Generate page layouts using AI based on your submitted content</li>
              <li>Show you view statistics for your published pages</li>
              <li>Improve reliability and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">What is public</h2>
            <p className="mt-3">
              Content you publish on your stage (bio, photos, videos, social links) is
              publicly visible at your URL. Do not publish information you do not want
              others to see.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Photo access</h2>
            <p className="mt-3">
              The mobile app requests photo library access only when you choose images
              for your profile. We upload selected images to our storage to display on
              your public page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Third parties</h2>
            <p className="mt-3">
              We use Apple Sign In, Google Sign In, Cloudflare (hosting), and Google
              Gemini (AI page generation). Each provider has its own privacy policy.
              We do not sell your personal information.
            </p>
          </section>

          <section id="account-deletion">
            <h2 className="text-lg font-semibold text-neutral-900">Retention & deletion</h2>
            <p className="mt-3">
              We keep account and profile data while your account is active. You may
              request deletion of your account and published pages by emailing{" "}
              <a
                href="mailto:privacy@getsuperstar.info"
                className="font-medium text-neutral-900 underline"
              >
                privacy@getsuperstar.info
              </a>{" "}
              or visit our{" "}
              <Link href="/account/delete" className="font-medium text-neutral-900 underline">
                account deletion page
              </Link>
              . We will delete or anonymize your data within 30 days, except where
              retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
            <p className="mt-3">
              Questions about this policy:{" "}
              <a
                href="mailto:privacy@getsuperstar.info"
                className="font-medium text-neutral-900 underline"
              >
                privacy@getsuperstar.info
              </a>
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← Back to Superstar
        </Link>
      </main>
    </div>
  );
}
