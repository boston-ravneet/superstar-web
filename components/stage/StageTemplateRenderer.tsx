"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type {
  StageTemplateDocument,
  StageTemplateSection,
} from "@/lib/types/stage-template";
import type { ConnectAction } from "@/lib/stage/resolve-connect-actions";
import {
  buildGoogleFontsHref,
  collectGoogleFontFamilies,
} from "@/lib/stage/google-fonts";
import { StageViewTracker } from "@/components/stage/StageViewTracker";
import { sanitizeGalleryTitleForDisplay } from "@/lib/stage/persona-section-titles";

const COLLAPSIBLE_SECTION_TYPES = new Set([
  "bio",
  "skills",
  "highlights",
  "quote",
]);

const ACCORDION_THRESHOLD = 3;

function sectionStyle(
  section: StageTemplateSection,
  palette: StageTemplateDocument["palette"],
) {
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

function parseConnectActions(raw: unknown): ConnectAction[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const value = entry as Record<string, unknown>;
      if (
        typeof value.label !== "string" ||
        typeof value.href !== "string" ||
        typeof value.kind !== "string"
      ) {
        return null;
      }

      return {
        label: value.label,
        href: value.href,
        kind: value.kind as ConnectAction["kind"],
      };
    })
    .filter((action): action is ConnectAction => Boolean(action));
}

function accordionTitle(section: StageTemplateSection): string {
  switch (section.type) {
    case "bio":
      return String(section.content.title ?? "About");
    case "gallery":
      return String(section.content.title ?? "Photos");
    case "skills":
      return String(section.content.title ?? "Highlights");
    case "highlights":
      return String(section.content.title ?? "Details");
    case "quote":
      return "Quote";
    default:
      return "Section";
  }
}

function clickableImageStyles(): CSSProperties {
  return {
    cursor: "zoom-in",
    border: "none",
    padding: 0,
    background: "transparent",
    display: "block",
    width: "100%",
  };
}

function HeroSection({
  section,
  palette,
  typography,
  avatarBorderRadius,
  onImageClick,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  typography: StageTemplateDocument["typography"];
  avatarBorderRadius: string;
  onImageClick?: (url: string, alt: string) => void;
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
      <p
        style={{
          color: palette.muted,
          letterSpacing: "0.2em",
          fontSize: 12,
          margin: 0,
        }}
      >
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
        onImageClick ? (
          <button
            type="button"
            aria-label={`View ${headline} profile photo`}
            onClick={() => onImageClick(avatarUrl, headline)}
            style={{
              ...clickableImageStyles(),
              width: isRow ? 112 : 128,
              height: isRow ? 112 : 128,
              flexShrink: 0,
              borderRadius: avatarBorderRadius,
              overflow: "hidden",
              border: `2px solid ${palette.border}`,
            }}
          >
            <img
              src={avatarUrl}
              alt={headline}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </button>
        ) : (
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
        )
      ) : null}
      {textBlock}
    </div>
  );
}

function GallerySection({
  section,
  palette,
  galleryImageBorderRadius,
  onImageClick,
  compact = false,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  galleryImageBorderRadius: string;
  onImageClick?: (url: string, alt: string) => void;
  compact?: boolean;
}) {
  const title = sanitizeGalleryTitleForDisplay(
    String(section.content.title ?? "Photos"),
  );
  const images = Array.isArray(section.content.images)
    ? (section.content.images as Array<{ url?: string; caption?: string; span?: number }>)
    : [];
  const isCircular = galleryImageBorderRadius === "50%";

  function renderImage(image: { url?: string; caption?: string }, index: number) {
    if (!image.url) {
      return null;
    }

    const alt = image.caption ?? `Photo ${index + 1}`;
    const img = (
      <img
        src={image.url}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );

    if (!onImageClick) {
      return img;
    }

    return (
      <button
        type="button"
        aria-label={`View ${alt}`}
        onClick={() => onImageClick(image.url!, alt)}
        style={clickableImageStyles()}
      >
        {img}
      </button>
    );
  }

  if (isCircular) {
    return (
      <div style={{ padding: compact ? "0 16px 16px" : "0 24px 24px" }}>
        {!compact ? (
          <h2 style={{ color: palette.text, marginBottom: 16, textAlign: "center" }}>
            {title}
          </h2>
        ) : null}
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
                {renderImage(image, index)}
              </div>
            ) : null,
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {!compact ? (
        <h2 style={{ color: palette.text, padding: "0 24px", marginBottom: 12 }}>
          {title}
        </h2>
      ) : null}
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
              <div style={{ height: 220, overflow: "hidden" }}>
                {renderImage(image, index)}
              </div>
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
  compact = false,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  typography: StageTemplateDocument["typography"];
  compact?: boolean;
}) {
  return (
    <div style={{ padding: compact ? "0 16px 16px" : "0 24px 8px" }}>
      <div
        style={{
          ...sectionStyle(section, palette),
          boxShadow: "0 8px 32px rgba(15, 23, 42, 0.08)",
        }}
      >
        {!compact ? (
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
        ) : null}
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
  compact = false,
}: {
  section: StageTemplateSection;
  palette: StageTemplateDocument["palette"];
  compact?: boolean;
}) {
  const tags = Array.isArray(section.content.tags)
    ? (section.content.tags as unknown[]).filter(
        (tag): tag is string => typeof tag === "string",
      )
    : [];

  return (
    <div style={{ padding: compact ? "0 16px 16px" : "0 24px 24px" }}>
      {!compact ? (
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
      ) : null}
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
  const fallbackLabel = String(section.content.label ?? "Let's connect");
  const actions = parseConnectActions(section.content.actions);
  const fallbackHref = String(section.content.href ?? "");

  if (actions.length === 0 && !fallbackHref) {
    return (
      <div style={{ padding: "0 24px 48px", textAlign: "center" }}>
        <p
          style={{
            color: palette.muted,
            fontSize: 14,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Add your email, phone, or social links in your bio so visitors know how
          to reach you.
        </p>
      </div>
    );
  }

  const rows =
    actions.length > 0
      ? actions
      : [{ label: fallbackLabel, href: fallbackHref, kind: "email" as const }];

  const linkStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: palette.text,
    textDecoration: "none",
    fontWeight: 700,
    padding: "14px 20px",
    borderRadius: 999,
    border: `1px solid ${palette.border}`,
    background: `${palette.primary}18`,
    minWidth: 140,
  } as const;

  return (
    <div style={{ padding: "0 24px 48px", textAlign: "center" }}>
      <p
        style={{
          color: palette.text,
          fontWeight: 800,
          fontSize: "1.05rem",
          marginBottom: 14,
        }}
      >
        {fallbackLabel}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {rows.map((action) => (
          <a
            key={`${action.kind}-${action.href}`}
            href={action.href}
            target={action.kind === "instagram" || action.kind === "tiktok" ? "_blank" : undefined}
            rel={
              action.kind === "instagram" || action.kind === "tiktok"
                ? "noreferrer"
                : undefined
            }
            style={linkStyle}
          >
            {action.label}
          </a>
        ))}
      </div>
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

function StageAccordion({
  section,
  title,
  open,
  onToggle,
  palette,
  children,
}: {
  section: StageTemplateSection;
  title: string;
  open: boolean;
  onToggle: () => void;
  palette: StageTemplateDocument["palette"];
  children: ReactNode;
}) {
  return (
    <div
      style={{
        margin: "0 16px 8px",
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        overflow: "hidden",
        background: `${palette.surface}cc`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-panel-${section.id}`}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          border: "none",
          background: "transparent",
          color: palette.text,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
          textAlign: "left",
        }}
      >
        <span>{title}</span>
        <span style={{ color: palette.primary, fontSize: 18, lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div id={`section-panel-${section.id}`}>{children}</div>
      ) : null}
    </div>
  );
}

function ImageLightbox({
  image,
  onClose,
}: {
  image: { url: string; alt: string };
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <button
        type="button"
        aria-label="Close image"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          border: "1px solid rgba(255,255,255,0.35)",
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          borderRadius: 999,
          width: 40,
          height: 40,
          cursor: "pointer",
          fontSize: 22,
        }}
      >
        ×
      </button>
      <img
        src={image.url}
        alt={image.alt}
        onClick={(event) => event.stopPropagation()}
        style={{
          maxWidth: "94vw",
          maxHeight: "88vh",
          objectFit: "contain",
          borderRadius: 12,
        }}
      />
    </div>
  );
}

function renderSectionBody(
  section: StageTemplateSection,
  template: StageTemplateDocument,
  imageStyle: { avatarBorderRadius: string; galleryImageBorderRadius: string },
  onImageClick: (url: string, alt: string) => void,
  compact = false,
) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          section={section}
          palette={template.palette}
          typography={template.typography}
          avatarBorderRadius={imageStyle.avatarBorderRadius}
          onImageClick={onImageClick}
        />
      );
    case "gallery":
      return (
        <GallerySection
          section={section}
          palette={template.palette}
          galleryImageBorderRadius={imageStyle.galleryImageBorderRadius}
          onImageClick={onImageClick}
          compact={compact}
        />
      );
    case "bio":
      return (
        <BioSection
          section={section}
          palette={template.palette}
          typography={template.typography}
          compact={compact}
        />
      );
    case "highlights":
      return <HighlightsSection section={section} palette={template.palette} />;
    case "skills":
      return (
        <SkillsSection
          section={section}
          palette={template.palette}
          compact={compact}
        />
      );
    case "quote":
      return (
        <QuoteSection
          section={section}
          palette={template.palette}
          typography={template.typography}
        />
      );
    case "cta":
      return <CtaSection section={section} palette={template.palette} />;
    case "social":
      return <SocialSection section={section} palette={template.palette} />;
    default:
      return null;
  }
}

export function StageTemplateRenderer({
  template,
  preview = false,
  profileId,
  trackViews = false,
}: {
  template: StageTemplateDocument;
  preview?: boolean;
  profileId?: string;
  trackViews?: boolean;
}) {
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const visibleSections = template.sections.filter((section) => section.visible);

  const useAccordions = useMemo(() => {
    const collapsibleCount = visibleSections.filter((section) =>
      COLLAPSIBLE_SECTION_TYPES.has(section.type),
    ).length;
    return collapsibleCount >= ACCORDION_THRESHOLD;
  }, [visibleSections]);

  const defaultOpenId = useMemo(() => {
    return (
      visibleSections.find((section) =>
        COLLAPSIBLE_SECTION_TYPES.has(section.type),
      )?.id ?? null
    );
  }, [visibleSections]);

  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const activeAccordionId = openAccordionId ?? defaultOpenId;

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

  const onImageClick = (url: string, alt: string) => {
    setLightboxImage({ url, alt });
  };

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
      {profileId && trackViews ? (
        <StageViewTracker profileId={profileId} enabled={!preview} />
      ) : null}

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
        {visibleSections.map((section) => {
          const inAccordion =
            useAccordions && COLLAPSIBLE_SECTION_TYPES.has(section.type);
          const body = renderSectionBody(
            section,
            template,
            imageStyle,
            onImageClick,
            inAccordion,
          );

          if (!body) {
            return null;
          }

          if (inAccordion) {
            return (
              <StageAccordion
                key={section.id}
                section={section}
                title={accordionTitle(section)}
                open={activeAccordionId === section.id}
                onToggle={() =>
                  setOpenAccordionId((current) =>
                    current === section.id ? null : section.id,
                  )
                }
                palette={template.palette}
              >
                {body}
              </StageAccordion>
            );
          }

          return <div key={section.id}>{body}</div>;
        })}
      </div>

      {lightboxImage ? (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      ) : null}
    </div>
  );
}
