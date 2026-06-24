export function LandingAbout() {
  return (
    <section id="about" className="border-t border-neutral-200 bg-neutral-50 px-6 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            One page for who you are
          </h2>
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-neutral-600">
          <p>
            Superstar is for anyone who wants a clean public presence — not just
            influencers or performers. Share your story, your work, and your links
            at{" "}
            <span className="font-medium text-neutral-900">getsuperstar.info/yourname</span>.
          </p>
          <p>
            Build it from your phone in minutes. Our AI designs a layout that fits
            you, whether you&apos;re in medicine, law, sports, art, tech, or still
            figuring it out.
          </p>
        </div>
      </div>
    </section>
  );
}
