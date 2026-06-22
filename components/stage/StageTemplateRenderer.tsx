import type {
  StageTemplateDocument,
  StageTemplateSection,
} from "@/lib/types/stage-template";
import {
  buildGoogleFontsHref,
  collectGoogleFontFamilies,
} from "@/lib/stage/google-fonts";

function sectionStyle(section: StageTemplateSection, palette: StageTemplateDocument["palette"]) {
  return {
    display: section.layout.display,
    flexDirection: section.layout.direction,
    alignItems: section.layout.align,
    justifyContent: section.layout.justify,
    gap: section.layout.gap,
    padding: section.layout.padding,
    margin: section.layout.margin,
    gridTemplateColumns:
      section.layout.display === "grid"
        ? `repeat(${section.layout.columns}, minmax(0, 1fr))`
        : undefined,
    background: section.style.background || "transparent",
    borderRadius: section.style.borderRadius || undefined,
    borderColor: section.style.borderColor || palette.border,
    borderWidth: section.style.borderWidth || undefined,
    borderStyle: section.style.borderWidth !== "0" ? "solid" : undefined,
    boxShadow: section.style.shadow !== "none" ? section.style.shadow : undefined,
    backdropFilter:
      section.style.backdropBlur !== "0"
        ? `blur(${section.style.backdropBlur})`
        : undefined,
  } as const;
}

function HeroSection({
  section,
  palette,
  typography,
  avatarBorderRadius,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  typography: StageTemplateDocument["typography"];
  avatarBorderRadius: string;
}) {
  const headline = String(section.content.headline ?? "");
  const handle = String(section.content.handle ?? "");
  const subheadline = String(section.content.subheadline ?? "");
  const avatarUrl = String(section.content.avatarUrl ?? "");
  const isRow = section.layout.direction === "row";

  const textBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isRow ? "flex-start" : "center",
        gap: "8px",
        flex: isRow ? 1 : undefined,
        minWidth: 0,
      }}
    >
      <p style={{ color: palette.muted, letterSpacing: "0.2em", fontSize: 12, margin: 0 }}>
        @{handle}
      </p>
      <h1
        style={{
          color: palette.text,
          fontFamily: typography.headingFont,
          fontWeight: typography.headingWeight,
          fontSize: typography.headingSize,
          margin: 0,
          textAlign: isRow ? "left" : "center",
        }}
      >
        {headline}
      </h1>
      {subheadline ? (
        <p
          style={{
            color: palette.muted,
            fontFamily: typography.bodyFont,
            fontSize: typography.bodySize,
            lineHeight: typography.lineHeight,
            maxWidth: 520,
            textAlign: isRow ? "left" : "center",
            margin: 0,
          }}
        >
          {subheadline}
        </p>
      ) : null}
    </div>
  );

  return (
    <div style={sectionStyle(section, palette)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={headline}
          style={{
            width: isRow ? 112 : 128,
            height: isRow ? 112 : 128,
            borderRadius: avatarBorderRadius,
            objectFit: "cover",
            border: `2px solid ${palette.border}`,
            flexShrink: 0,
          }}
        />
      ) : null}
      {textBlock}
    </div>
  );
}

function GallerySection({
  section,
  palette,
  galleryImageBorderRadius,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  galleryImageBorderRadius: string;
}) {
  const title = String(section.content.title ?? "Gallery");
  const images = Array.isArray(section.content.images)
    ? (section.content.images as Array<{ url?: string; caption?: string; span?: number }>)
    : [];
  const isCircular = galleryImageBorderRadius === "50%";

  if (isCircular) {
    return (
      <div style={{ padding: "0 24px 24px" }}>
        <h2 style={{ color: palette.text, marginBottom: 16, textAlign: "center" }}>
          {title}
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {images.map((image, index) =>
            image.url ? (
              <div
                key={`${image.url}-${index}`}
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `2px solid ${palette.border}`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={image.url}
                  alt={image.caption ?? `Photo ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            ) : null,
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: palette.text, padding: "0 24px", marginBottom: 12 }}>{title}</h2>
      <div style={sectionStyle(section, palette)}>
        {images.map((image, index) =>
          image.url ? (
            <figure
              key={`${image.url}-${index}`}
              style={{
                gridColumn: image.span === 2 ? "span 2 / span 2" : undefined,
                margin: 0,
                overflow: "hidden",
                borderRadius: galleryImageBorderRadius,
                border: `1px solid ${palette.border}`,
              }}
            >
              <img
                src={image.url}
                alt={image.caption ?? `Photo ${index + 1}`}
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {image.caption ? (
                <figcaption
                  style={{
                    padding: "8px 12px",
                    color: palette.muted,
                    background: palette.surface,
                    fontSize: 13,
                  }}
                >
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null,
        )}
      </div>
    </div>
  );
}

function BioSection({
  section,
  palette,
  typography,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  typography: StageTemplateDocument["typography"];
}) {
  return (
    <div style={{ padding: "0 24px 8px" }}>
      <div
        style={{
          ...sectionStyle(section, palette),
          boxShadow: "0 8px 32px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h2
          style={{
            color: palette.text,
            marginTop: 0,
            marginBottom: 12,
            fontSize: "1.125rem",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {String(section.content.title ?? "About")}
        </h2>
        <p
          style={{
            color: palette.muted,
            fontFamily: typography.bodyFont,
            fontSize: typography.bodySize,
            lineHeight: typography.lineHeight,
            marginBottom: 0,
            textAlign: "center",
          }}
        >
          {String(section.content.text ?? "")}
        </p>
      </div>
    </div>
  );
}

function HighlightsSection({
  section,
  palette,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
}) {
  const items = Array.isArray(section.content.items)
    ? (section.content.items as Array<{ title?: string; body?: string }>)
    : [];

  return (
    <div style={{ padding: "0 24px" }}>
      <h2 style={{ color: palette.text }}>{String(section.content.title ?? "Details")}</h2>
      <div style={sectionStyle(section, palette)}>
        {items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            style={{
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ color: palette.primary, marginTop: 0 }}>{item.title}</h3>
            <p style={{ color: palette.muted, marginBottom: 0 }}>{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsSection({
  section,
  palette,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
}) {
  const tags = Array.isArray(section.content.tags)
    ? (section.content.tags as unknown[]).filter((tag): tag is string => typeof tag === "string")
    : [];

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <h2
        style={{
          color: palette.text,
          marginBottom: 12,
          textAlign: "center",
          fontSize: "1.125rem",
          fontWeight: 700,
        }}
      >
        {String(section.content.title ?? "Highlights")}
      </h2>
      <div
        style={{
          ...sectionStyle(section, palette),
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              color: palette.text,
              background: `${palette.primary}22`,
              border: `1px solid ${palette.primary}55`,
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuoteSection({
  section,
  palette,
  typography,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  typography: StageTemplateDocument["typography"];
}) {
  return (
    <div style={{ padding: "0 24px" }}>
      <blockquote
        style={{
          ...sectionStyle(section, palette),
          color: palette.text,
          fontFamily: typography.bodyFont,
          fontSize: "1.25rem",
          fontStyle: "italic",
        }}
      >
        “{String(section.content.text ?? "")}”
        {section.content.author ? (
          <footer style={{ color: palette.muted, marginTop: 12, fontSize: 14 }}>
            — {String(section.content.author)}
          </footer>
        ) : null}
      </blockquote>
    </div>
  );
}

function CtaSection({
  section,
  palette,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
}) {
  const label = String(section.content.label ?? "Get in touch");
  const href = String(section.content.href ?? "#");

  return (
    <div style={{ padding: "0 24px 48px", textAlign: "center" }}>
      <a
        href={href}
        style={{
          ...sectionStyle(section, palette),
          display: "inline-flex",
          color: palette.text,
          textDecoration: "none",
          fontWeight: 700,
          padding: "14px 28px",
        }}
      >
        {label}
      </a>
    </div>
  );
}

function SocialSection({
  section,
  palette,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
}) {
  const instagramHandle = section.content.instagramHandle
    ? String(section.content.instagramHandle)
    : null;
  const tiktokHandle = section.content.tiktokHandle
    ? String(section.content.tiktokHandle)
    : null;

  if (!instagramHandle && !tiktokHandle) {
    return null;
  }

  const linkStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: 999,
    border: `1px solid ${palette.border}`,
    background: palette.surface,
    color: palette.text,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  } as const;

  return (
    <div
      style={{
        ...sectionStyle(section, palette),
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
        padding: "8px 24px 20px",
      }}
    >
      {instagramHandle ? (
        <a
          href={`https://instagram.com/${instagramHandle}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Instagram @${instagramHandle}`}
          style={linkStyle}
        >
          Instagram · @{instagramHandle}
        </a>
      ) : null}
      {tiktokHandle ? (
        <a
          href={`https://tiktok.com/@${tiktokHandle}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`TikTok @${tiktokHandle}`}
          style={linkStyle}
        >
          TikTok · @{tiktokHandle}
        </a>
      ) : null}
    </div>
  );
}

function renderSection(
  section: StageTemplateSection,
  template: StageTemplateDocument,
  imageStyle: { avatarBorderRadius: string; galleryImageBorderRadius: string },
) {
  if (!section.visible) {
    return null;
  }

  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          key={section.id}
          section={section}
          palette={template.palette}
          typography={template.typography}
          avatarBorderRadius={imageStyle.avatarBorderRadius}
        />
      );
    case "gallery":
      return (
        <GallerySection
          key={section.id}
          section={section}
          palette={template.palette}
          galleryImageBorderRadius={imageStyle.galleryImageBorderRadius}
        />
      );
    case "bio":
      return (
        <BioSection
          key={section.id}
          section={section}
          palette={template.palette}
          typography={template.typography}
        />
      );
    case "highlights":
      return <HighlightsSection key={section.id} section={section} palette={template.palette} />;
    case "skills":
      return <SkillsSection key={section.id} section={section} palette={template.palette} />;
    case "quote":
      return (
        <QuoteSection
          key={section.id}
          section={section}
          palette={template.palette}
          typography={template.typography}
        />
      );
    case "cta":
      return <CtaSection key={section.id} section={section} palette={template.palette} />;
    case "social":
      return <SocialSection key={section.id} section={section} palette={template.palette} />;
    default:
      return null;
  }
}

export function StageTemplateRenderer({
  template,
  preview = false,
}: {
  template: StageTemplateDocument;
  preview?: boolean;
}) {
  const background =
    template.canvas.backgroundType === "gradient"
      ? `linear-gradient(180deg, ${template.canvas.background} 0%, ${template.canvas.backgroundGradientTo ?? template.canvas.background} 100%)`
      : template.canvas.background;

  const imageStyle = {
    avatarBorderRadius: template.assets?.avatarBorderRadius ?? "32px",
    galleryImageBorderRadius: template.assets?.galleryImageBorderRadius ?? "20px",
  };

  const googleFontsHref = buildGoogleFontsHref(
    collectGoogleFontFamilies(template.typography),
  );

  return (
    <div
      style={{
        minHeight: template.canvas.minHeight,
        background,
        color: template.palette.text,
        padding: template.canvas.padding,
        fontFamily: template.typography.bodyFont,
      }}
    >
      {googleFontsHref ? (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={googleFontsHref} />
        </>
      ) : null}
      {preview ? (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: `${template.palette.primary}22`,
            borderBottom: `1px solid ${template.palette.primary}55`,
            color: template.palette.text,
            textAlign: "center",
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Preview — not published yet
        </div>
      ) : null}

      <div style={{ maxWidth: template.canvas.maxWidth, margin: "0 auto" }}>
        {template.sections.map((section) =>
          renderSection(section, template, imageStyle),
        )}
      </div>
    </div>
  );
}
