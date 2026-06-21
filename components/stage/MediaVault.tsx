"use client";

import { useRef, useState } from "react";
import type { StagePhoto, StageVideo } from "@/lib/types/stage";
import type { StageThemeClasses } from "@/lib/stage/theme-styles";

function StageMediaImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (src.startsWith("http://")) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}

function VideoShowreel({ videos }: { videos: StageVideo[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVideo = videos[activeIndex];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <video
          key={activeVideo.id}
          className="aspect-video w-full bg-black object-cover"
          controls
          playsInline
          preload="metadata"
          poster={activeVideo.posterUrl}
        >
          <source src={activeVideo.url} />
          Your browser does not support inline video playback.
        </video>
      </div>

      {videos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {videos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 rounded-2xl border px-4 py-2 text-left text-sm transition ${
                index === activeIndex
                  ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {video.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-zinc-400">{activeVideo.title}</p>
      )}
    </div>
  );
}

function PhotoGallery({ photos }: { photos: StagePhoto[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: "left" | "right") {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    const delta = direction === "left" ? -280 : 280;
    node.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Portfolio Gallery
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Scroll gallery left"
            onClick={() => scrollBy("left")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Scroll gallery right"
            onClick={() => scrollBy("right")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="w-[78%] shrink-0 snap-center sm:w-[58%]"
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-950">
              <StageMediaImage
                src={photo.url}
                alt={photo.caption ?? "Portfolio asset"}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            {photo.caption ? (
              <figcaption className="mt-2 text-sm text-zinc-500">
                {photo.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </div>
  );
}

export function MediaVault({
  videos,
  photos,
  theme,
}: {
  videos: StageVideo[];
  photos: StagePhoto[];
  theme: StageThemeClasses;
}) {
  if (videos.length === 0 && photos.length === 0) {
    return null;
  }

  return (
    <section className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        {videos.length > 0 ? (
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.sectionLabel}`}>
                  Media Vault
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">Showreel</h2>
              </div>
            </div>
            <VideoShowreel videos={videos} />
          </div>
        ) : null}

        {photos.length > 0 ? <PhotoGallery photos={photos} /> : null}
      </div>
    </section>
  );
}
