"use client";

import type { CSSProperties } from "react";
import {
  buildCanvasBackgroundLayers,
  motifOverlayStyle,
  type CanvasMotifId,
} from "@/lib/stage/canvas-motifs";
import type {
  StageTemplateCanvas,
  StageTemplatePalette,
} from "@/lib/types/stage-template";

export function StageCanvasBackground({
  canvas,
  palette,
  motif = "none",
}: {
  canvas: StageTemplateCanvas;
  palette: StageTemplatePalette;
  motif?: CanvasMotifId;
}) {
  const layers = buildCanvasBackgroundLayers(canvas, palette, motif);
  const overlayExtras = motifOverlayStyle(motif);

  const fixedLayer: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  };

  return (
    <>
      <div
        aria-hidden
        style={{
          ...fixedLayer,
          background: layers.base,
        }}
      />
      {layers.overlay ? (
        <div
          aria-hidden
          style={{
            ...fixedLayer,
            backgroundImage: layers.overlay,
            backgroundRepeat: overlayExtras.backgroundRepeat ?? "no-repeat",
            backgroundSize: overlayExtras.backgroundSize ?? "100% 100%",
            backgroundPosition: overlayExtras.backgroundPosition ?? "center",
            opacity: layers.overlayOpacity ?? 1,
            mixBlendMode: (layers.overlayBlendMode as CSSProperties["mixBlendMode"]) ?? "normal",
          }}
        />
      ) : null}
      {layers.grain ? (
        <div
          aria-hidden
          style={{
            ...fixedLayer,
            backgroundImage: layers.grain,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
            opacity: layers.grainOpacity ?? 0.2,
            mixBlendMode: (layers.grainBlendMode as CSSProperties["mixBlendMode"]) ?? "overlay",
          }}
        />
      ) : null}
    </>
  );
}
