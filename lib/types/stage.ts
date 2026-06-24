import type { ProfilePublicView } from "@/lib/types/profile";

export interface StageVideo {
  id: string;
  url: string;
  title: string;
  posterUrl?: string;
}

export interface StagePhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface BookingContact {
  label: string;
  href: string;
}

import type { LayoutConfig } from "@/lib/types/layout";

export interface StageProfileView extends ProfilePublicView {
  profileStatus: "active" | "reserved_by_system" | "suspended";
  publishStatus: import("@/lib/types/stage-template").PublishStatus;
  layoutConfig: LayoutConfig;
  stageTemplate: import("@/lib/types/stage-template").StageTemplateDocument | null;
  liveStageTemplate: import("@/lib/types/stage-template").StageTemplateDocument | null;
  videos: StageVideo[];
  photos: StagePhoto[];
  skills: string[];
  bookingContact: BookingContact | null;
}

export interface SocialLinksPayload {
  accounts?: import("@/lib/stage/social-accounts").SocialAccount[];
  links?: import("@/lib/types/profile").SocialLink[];
  videos?: StageVideo[];
  photos?: StagePhoto[];
  skills?: string[];
  booking?: BookingContact;
}
