const EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/;

export function extractEmailFromText(text: string): string | null {
  const match = text.match(EMAIL_PATTERN);
  return match?.[0]?.toLowerCase() ?? null;
}

export function extractPhoneFromText(text: string): string | null {
  const match = text.match(PHONE_PATTERN);
  if (!match) {
    return null;
  }

  const digits = match[0].replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }

  return match[0].trim();
}

export function normalizePhoneForTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return digits;
}
