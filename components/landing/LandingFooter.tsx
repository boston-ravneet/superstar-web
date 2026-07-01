import { SuperstarLogoLink } from "@/components/brand/SuperstarLogo";

const FOOTER_LINKS = [
  { label: "About", href: "#about" },
  { label: "Claim a handle", href: "#claim" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-12 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SuperstarLogoLink variant="mark-dark" size={32} />
          <p className="mt-4 text-sm text-neutral-500">
            © {new Date().getFullYear()} Superstar
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-600">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-neutral-900"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://getsuperstar.info"
            className="transition hover:text-neutral-900"
          >
            getsuperstar.info
          </a>
        </nav>
      </div>
    </footer>
  );
}
