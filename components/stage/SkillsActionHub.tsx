import type { BookingContact } from "@/lib/types/stage";
import type { StageThemeClasses } from "@/lib/stage/theme-styles";

export function SkillsActionHub({
  skills,
  bookingContact,
  username,
  theme,
}: {
  skills: string[];
  bookingContact: BookingContact | null;
  username: string;
  theme: StageThemeClasses;
}) {
  const contact =
    bookingContact ??
    ({
      label: "Contact Management",
      href: `mailto:booking@${username}.getsuperstar.info?subject=Booking%20Inquiry%20for%20@${username}`,
    } satisfies BookingContact);

  return (
    <section className="px-5 pb-16 pt-4 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className={`rounded-[2rem] border p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8 ${theme.card}`}>
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.sectionLabel}`}>
              Skills & Action Hub
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Credentials & Booking
            </h2>
          </div>

          {skills.length > 0 ? (
            <div className="mb-8 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mb-8 text-sm leading-relaxed text-zinc-500">
              Specialized skills and credentials will appear here as this stage
              is enriched.
            </p>
          )}

          <a
            href={contact.href}
            target={contact.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={contact.href.startsWith("mailto:") ? undefined : "noreferrer"}
            className={`inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r px-6 py-4 text-base font-bold shadow-[0_16px_50px_rgba(168,85,247,0.28)] transition hover:scale-[1.01] hover:shadow-[0_20px_60px_rgba(168,85,247,0.34)] sm:w-auto ${theme.cta} ${theme.cta.includes("text-slate-950") ? "text-slate-950" : "text-white"}`}
          >
            {contact.label}
          </a>
        </div>
      </div>
    </section>
  );
}
