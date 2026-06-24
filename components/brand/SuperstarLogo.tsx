import Image from "next/image";
import Link from "next/link";

export type SuperstarLogoVariant = "mark" | "mark-dark" | "full";

type SuperstarLogoProps = {
  /** `mark` = gold star. `mark-dark` = black star (header/nav). `full` = gold trophy. */
  variant?: SuperstarLogoVariant;
  showWordmark?: boolean;
  size?: number;
  className?: string;
};

const LOGO_SRC: Record<SuperstarLogoVariant, string> = {
  mark: "/brand/star.png",
  "mark-dark": "/brand/star-black.png",
  full: "/brand/logo-full.png",
};

export function SuperstarLogo({
  variant = "mark",
  showWordmark = true,
  size = 40,
  className = "",
}: SuperstarLogoProps) {
  const src = LOGO_SRC[variant];

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src={src}
        alt="Superstar"
        width={size}
        height={size}
        className="h-auto w-auto object-contain"
        style={{ width: size, height: size }}
        priority={variant === "mark" || variant === "mark-dark"}
      />
      {showWordmark ? (
        <span className="text-xl font-semibold tracking-tight text-neutral-900">
          Superstar
        </span>
      ) : null}
    </span>
  );
}

export function SuperstarLogoLink({
  variant = "mark",
  showWordmark = true,
  size = 40,
}: SuperstarLogoProps) {
  return (
    <Link href="/" className="inline-flex transition opacity-90 hover:opacity-100">
      <SuperstarLogo variant={variant} showWordmark={showWordmark} size={size} />
    </Link>
  );
}

/** Full trophy mark — hero and marketing blocks only. */
export function SuperstarLogoFull({
  size = 160,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={LOGO_SRC.full}
      alt="Superstar"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      priority
    />
  );
}
