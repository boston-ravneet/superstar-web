export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-900 px-6 py-10 text-center text-sm text-zinc-500">
      <p>
        Superstar App ·{" "}
        <a
          href="https://getsuperstar.info"
          className="text-fuchsia-400 transition hover:text-fuchsia-300"
        >
          getsuperstar.info
        </a>
      </p>
      <p className="mt-2">Built on Next.js, OpenNext, Cloudflare D1 &amp; R2.</p>
    </footer>
  );
}
