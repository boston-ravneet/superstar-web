const HIGHLIGHTS = [
  {
    title: "One link, everything you",
    body: "Photo, bio, portfolio, videos, and social links — organized on a single page people can bookmark and share.",
  },
  {
    title: "Ready in about a minute",
    body: "No website builder rabbit holes. Add your details, pick a style, and publish from the app.",
  },
  {
    title: "Works in any field",
    body: "Use it on a résumé, in a bio, on a business card, or anywhere you want people to find the real you.",
  },
];

export function LandingHighlights() {
  return (
    <section className="border-t border-neutral-200 px-6 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Simple enough for everyone
        </h2>
        <ul className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-10">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title}>
              <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-neutral-600">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
