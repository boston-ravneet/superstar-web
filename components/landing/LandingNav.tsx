import { SuperstarLogoLink } from "@/components/brand/SuperstarLogo";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <SuperstarLogoLink variant="mark-dark" size={36} />
        <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
          <a href="#about" className="hidden transition hover:text-neutral-900 sm:inline">
            About
          </a>
          <a
            href="#claim"
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-white transition hover:bg-neutral-800"
          >
            Claim your handle
          </a>
        </nav>
      </div>
    </header>
  );
}
