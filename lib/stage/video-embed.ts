export type VideoEmbedProvider = "youtube" | "vimeo" | "tiktok" | "unknown";

export interface ParsedVideoEmbed {
  provider: VideoEmbedProvider;
  sourceUrl: string;
  embedUrl: string;
  videoId: string;
}

function parseYoutubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1).split("/")[0] || null;
  }

  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/")[2] ?? null;
  }

  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/")[2] ?? null;
  }

  return url.searchParams.get("v");
}

function parseVimeoId(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts.find((part) => /^\d+$/.test(part));
  return id ?? null;
}

function parseTiktokId(url: URL): string | null {
  const match = url.pathname.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

export function parseVideoEmbedUrl(raw: string): ParsedVideoEmbed | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    const videoId = parseYoutubeId(url);
    if (!videoId) {
      return null;
    }
    return {
      provider: "youtube",
      sourceUrl: url.toString(),
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      videoId,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const videoId = parseVimeoId(url);
    if (!videoId) {
      return null;
    }
    return {
      provider: "vimeo",
      sourceUrl: url.toString(),
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      videoId,
    };
  }

  if (host === "tiktok.com" || host === "vm.tiktok.com") {
    const videoId = parseTiktokId(url);
    if (!videoId) {
      return null;
    }
    return {
      provider: "tiktok",
      sourceUrl: url.toString(),
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      videoId,
    };
  }

  return null;
}

export function validateShowreelUrl(raw: string): boolean {
  return parseVideoEmbedUrl(raw) !== null;
}

export interface ShowreelVideoContent {
  url: string;
  embedUrl: string;
  provider: VideoEmbedProvider;
  videoId: string;
  title?: string;
}

export function buildShowreelVideos(
  videos: Array<{ url: string; title?: string }>,
): ShowreelVideoContent[] {
  return videos.flatMap((video) => {
    const parsed = parseVideoEmbedUrl(video.url);
    if (!parsed) {
      return [];
    }

    const item: ShowreelVideoContent = {
      url: parsed.sourceUrl,
      embedUrl: parsed.embedUrl,
      provider: parsed.provider,
      videoId: parsed.videoId,
    };
    if (video.title?.trim()) {
      item.title = video.title.trim();
    }
    return [item];
  });
}
