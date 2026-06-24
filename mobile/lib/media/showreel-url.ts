export function isValidShowreelUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return true;
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return false;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    return true;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    return true;
  }

  if (host === "tiktok.com" || host === "vm.tiktok.com") {
    return true;
  }

  return false;
}
