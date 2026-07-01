import Link from "next/link";
import { SuperstarLogoLink } from "@/components/brand/SuperstarLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of use and content policy for Superstar.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-5 sm:px-10">
        <SuperstarLogoLink variant="mark-dark" size={36} />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: June 24, 2026</p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-neutral-700">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Agreement</h2>
            <p className="mt-3">
              By creating an account, building a page, or publishing content on Superstar
              (&quot;we&quot;, &quot;us&quot;), you agree to these Terms & Conditions and
              our{" "}
              <Link href="/privacy" className="font-medium text-neutral-900 underline">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Your content</h2>
            <p className="mt-3">
              You keep ownership of photos, text, and links you upload. You grant us a
              license to host, display, and process that content so we can operate your
              public stage page and generate layouts with AI.
            </p>
            <p className="mt-3">
              You are responsible for everything you upload and publish. Only share
              content you have the right to use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Prohibited content</h2>
            <p className="mt-3">You may not upload, publish, or attempt to generate pages from content that:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Is illegal or promotes unlawful activity</li>
              <li>Is sexually explicit, pornographic, or exploits minors in any way</li>
              <li>Depicts graphic violence, gore, or animal cruelty</li>
              <li>Promotes hate, harassment, or violence against individuals or groups</li>
              <li>Includes non-consensual intimate imagery</li>
              <li>Infringes someone else&apos;s copyright, trademark, or privacy rights</li>
              <li>Contains malware, phishing, scams, or deceptive impersonation</li>
            </ul>
            <p className="mt-3">
              We use automated review (including AI) to detect policy violations in
              uploaded images. Builds may fail if content appears to violate this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Public pages</h2>
            <p className="mt-3">
              When you publish, your stage is publicly visible at getsuperstar.info/yourname.
              Do not publish personal information you do not want others to see.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Acceptable use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Do not attempt to bypass content safeguards or abuse the service</li>
              <li>Do not scrape, reverse engineer, or overload our systems</li>
              <li>Do not use Superstar for spam or misleading promotion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Enforcement</h2>
            <p className="mt-3">
              We may remove content, block builds, suspend handles, or terminate accounts
              that violate these terms or create legal or safety risk. We may update these
              terms; continued use after updates means you accept the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Disclaimer</h2>
            <p className="mt-3">
              Superstar is provided &quot;as is&quot; without warranties. We are not liable
              for indirect or consequential damages arising from your use of the service,
              to the extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
            <p className="mt-3">
              Questions about these terms:{" "}
              <a
                href="mailto:legal@getsuperstar.info"
                className="font-medium text-neutral-900 underline"
              >
                legal@getsuperstar.info
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
