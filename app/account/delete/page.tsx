import Link from "next/link";
import { SuperstarLogoLink } from "@/components/brand/SuperstarLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete your account",
  description: "Request deletion of your Superstar account and associated data.",
};

export default function AccountDeletePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-5 sm:px-10">
        <SuperstarLogoLink variant="mark-dark" size={36} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight">Delete your account</h1>
        <p className="mt-2 text-sm text-neutral-500">Superstar · getsuperstar.info</p>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-neutral-700">
          <p>
            You can request deletion of your Superstar account and all associated data,
            including your published stage pages, uploaded photos, and profile information.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Delete in the app</h2>
            <p className="mt-3">
              Open the Superstar app, go to <strong className="text-neutral-900">Account settings</strong> from
              your dashboard, and tap <strong className="text-neutral-900">Delete my account</strong>. Confirm
              twice to permanently delete your account and all associated data immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Delete by email</h2>
            <p className="mt-3">
              You can also email{" "}
              <a
                href="mailto:privacy@getsuperstar.info?subject=Account%20deletion%20request"
                className="font-medium text-neutral-900 underline"
              >
                privacy@getsuperstar.info
              </a>{" "}
              from the address linked to your account if you cannot access the app.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Include &quot;Account deletion request&quot; in the subject line and the
                handle(s) you want removed, if any.
              </li>
              <li>
                We will confirm and delete or anonymize your data within{" "}
                <strong className="text-neutral-900">30 days</strong>, except where
                retention is required by law.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">What gets deleted</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Your account and sign-in association</li>
              <li>All handles and published pages under your account</li>
              <li>Uploaded photos, bios, and builder data</li>
              <li>View analytics tied to your profiles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Partial deletion (without closing your account)</h2>
            <p className="mt-3">
              To remove specific content only — for example one handle, certain photos, or
              your bio — email{" "}
              <a
                href="mailto:privacy@getsuperstar.info?subject=Data%20deletion%20request"
                className="font-medium text-neutral-900 underline"
              >
                privacy@getsuperstar.info
              </a>{" "}
              with what you want removed, or use <strong className="text-neutral-900">Edit stage</strong> in
              the Superstar app to update or replace content and republish.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">What we may keep</h2>
            <p className="mt-3">
              We delete or anonymize requested data within{" "}
              <strong className="text-neutral-900">30 days</strong>. We may retain minimal
              records only where required by law (for example fraud prevention or legal
              compliance). Anonymous, aggregated statistics that cannot identify you may
              be kept.
            </p>
          </section>

          <p className="text-sm text-neutral-500">
            See our{" "}
            <Link href="/privacy" className="font-medium text-neutral-900 underline">
              Privacy Policy
            </Link>{" "}
            for more on data retention.
          </p>
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
