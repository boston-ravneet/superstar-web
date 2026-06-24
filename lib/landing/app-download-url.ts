const APP_DOWNLOAD_PATH = "/app";

export function appDownloadUrl(handle?: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://getsuperstar.info";

  const url = new URL(APP_DOWNLOAD_PATH, base);

  const normalized = handle?.trim().toLowerCase().replace(/^@/, "");
  if (normalized) {
    url.searchParams.set("handle", normalized);
  }

  return url.toString();
}

export function qrCodeImageUrl(targetUrl: string, size = 160): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}
