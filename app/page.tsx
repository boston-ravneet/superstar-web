import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingHero />
      <LandingFeatures />
      <LandingFooter />
    </div>
  );
}
