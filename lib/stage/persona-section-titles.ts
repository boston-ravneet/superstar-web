const RESUME_GALLERY_TITLE =
  /\b(leadership|engagements?|professional summary|career highlights|work history|experience|qualifications|credentials|overview)\b/i;

const GENERIC_GALLERY_TITLE =
  /^(gallery|photos?|images?|media)$/i;

/** Titles that read like LinkedIn sections, not photo areas. */
export function isResumeStyleGalleryTitle(title: string): boolean {
  const normalized = title.trim();
  if (!normalized) {
    return true;
  }

  if (GENERIC_GALLERY_TITLE.test(normalized)) {
    return false;
  }

  return RESUME_GALLERY_TITLE.test(normalized);
}

/** Last-resort display fix for legacy templates with résumé-style gallery headers. */
export function sanitizeGalleryTitleForDisplay(title: string): string {
  const trimmed = title.trim();
  if (!trimmed || isResumeStyleGalleryTitle(trimmed)) {
    return "Photos";
  }
  return trimmed;
}
