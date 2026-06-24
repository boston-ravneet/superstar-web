import { Suspense } from "react";
import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingClaimHero } from "@/components/landing/LandingClaimHero";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingGetStarted } from "@/components/landing/LandingGetStarted";
import { LandingHighlights } from "@/components/landing/LandingHighlights";
import { LandingNav } from "@/components/landing/LandingNav";
import { pickLandingTagline } from "@/lib/landing/taglines";

export default function HomePage() {
  const tagline = pickLandingTagline();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <LandingNav />
      <main>
        <Suspense fallback={null}>
          <LandingClaimHero tagline={tagline} />
        </Suspense>
        <LandingAbout />
        <LandingHighlights />
        <LandingGetStarted />
      </main>
      <LandingFooter />
    </div>
  );
}
