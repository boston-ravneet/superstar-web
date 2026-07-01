import type { ProfileRecord } from "@/lib/types/profile";
import type {
  BookingContact,
  StagePhoto,
  StageProfileView,
  StageVideo,
} from "@/lib/types/stage";
import { parseLayoutConfig } from "@/lib/stage/parse-layout-config";
import { parseStageTemplate } from "@/lib/stage/parse-stage-template";
import { parseSocialLinksPayload } from "@/lib/stage/parse-social-links";
import { refreshLiveTemplate } from "@/lib/stage/refresh-live-template";
import type { PublishStatus } from "@/lib/types/stage-template";

function mapVideos(entries: StageVideo[] | undefined): StageVideo[] {
  return (entries ?? [])
    .filter((entry) => Boolean(entry.url))
    .map((entry, index) => ({
      id: entry.id ?? `video-${index}`,
      url: entry.url,
      title: entry.title ?? `Showreel ${index + 1}`,
      posterUrl: entry.posterUrl,
    }));
}

function mapPhotos(entries: StagePhoto[] | undefined): StagePhoto[] {
  return (entries ?? [])
    .filter((entry) => Boolean(entry.url))
    .map((entry, index) => ({
      id: entry.id ?? `photo-${index}`,
      url: entry.url,
      caption: entry.caption,
    }));
}

function mapLayoutVideos(
  layoutConfig: ReturnType<typeof parseLayoutConfig>,
): StageVideo[] {
  return layoutConfig.showreel_videos.map((video, index) => ({
    id: `layout-video-${index}`,
    url: video.url,
    title: video.title ?? `Showreel ${index + 1}`,
    posterUrl: video.posterUrl,
  }));
}

function mapLayoutPhotos(
  layoutConfig: ReturnType<typeof parseLayoutConfig>,
): StagePhoto[] {
  return layoutConfig.gallery_urls.map((photo, index) => ({
    id: `layout-photo-${index}`,
    url: photo.url,
    caption: photo.caption,
  }));
}

export function buildStageProfileView(record: ProfileRecord): StageProfileView {
  const layoutConfig = parseLayoutConfig(record.layout_config_json);
  const payload = parseSocialLinksPayload(record.social_links_json);
  const socialLinks = payload.links ?? [];

  const layoutPhotos = mapLayoutPhotos(layoutConfig);
  const legacyPhotos = mapPhotos(payload.photos);
  const photos = layoutPhotos.length > 0 ? layoutPhotos : legacyPhotos;

  if (record.profile_image_url) {
    const heroListed = photos.some(
      (photo) => photo.url === record.profile_image_url,
    );

    if (!heroListed) {
      photos.unshift({
        id: "hero-avatar",
        url: record.profile_image_url,
        caption: "Profile",
      });
    }
  }

  const youtubeVideos: StageVideo[] = socialLinks
    .filter((link) => link.platform === "youtube")
    .map((link, index) => ({
      id: `youtube-${index}`,
      url: link.url,
      title: link.label || "Featured video",
    }));

  const layoutVideos = mapLayoutVideos(layoutConfig);
  const legacyVideos = mapVideos(payload.videos);
  const videoSource =
    layoutVideos.length > 0 ? layoutVideos : [...legacyVideos, ...youtubeVideos];

  const videos = videoSource.filter(
    (video, index, array) =>
      array.findIndex((entry) => entry.url === video.url) === index,
  );

  const layoutSkills = layoutConfig.skill_tags.filter((skill) => skill.length > 0);
  const legacySkills = (payload.skills ?? []).filter((skill) => skill.trim().length > 0);
  const skills = layoutSkills.length > 0 ? layoutSkills : legacySkills;

  const bookingFromLink = socialLinks.find((link) =>
    /book|mgmt|management|contact|agent/i.test(link.label),
  );

  const bookingContact: BookingContact | null =
    layoutConfig.booking_href && layoutConfig.booking_label
      ? {
          label: layoutConfig.booking_label,
          href: layoutConfig.booking_href,
        }
      : payload.booking ??
        (bookingFromLink
          ? { label: bookingFromLink.label, href: bookingFromLink.url }
          : null);

  const profileStatus =
    record.profile_status ??
    (record.is_locked === 1 ? "reserved_by_system" : "active");

  const publishStatus: PublishStatus =
    record.publish_status ?? "published";

  const stageTemplateRaw = parseStageTemplate(record.stage_template_json ?? null);
  const publishedTemplate = parseStageTemplate(
    record.published_stage_template_json ?? null,
  );

  const refreshContext = {
    bio: record.bio ?? "",
    displayName: record.display_name ?? record.username,
    username: record.username,
    instagramHandle: record.instagram_handle,
    tiktokHandle: record.tiktok_handle,
    socialLinksJson: record.social_links_json,
    imageUrls: photos.map((photo) => photo.url),
  };

  const stageTemplate = stageTemplateRaw
    ? refreshLiveTemplate(stageTemplateRaw, refreshContext)
    : null;

  const rawLiveTemplate =
    publishStatus === "published"
      ? (publishedTemplate ?? stageTemplateRaw)
      : stageTemplateRaw;

  const liveStageTemplate = rawLiveTemplate
    ? refreshLiveTemplate(rawLiveTemplate, refreshContext)
    : null;

  return {
    id: record.id,
    username: record.username,
    displayName: record.display_name ?? record.username,
    bio: record.bio ?? "",
    profileImageUrl: record.profile_image_url,
    socialLinks,
    instagramHandle: record.instagram_handle,
    tiktokHandle: record.tiktok_handle,
    isVerified: record.is_verified === 1,
    isLocked: record.is_locked === 1,
    profileStatus,
    publishStatus,
    layoutConfig,
    stageTemplate,
    liveStageTemplate,
    videos,
    photos,
    skills,
    bookingContact,
  };
}
