import type { StageSectionLayout, StageSectionStyle } from "@/lib/types/stage-template";

export const DEFAULT_LAYOUT: StageSectionLayout = {
  display: "flex",
  direction: "column",
  align: "center",
  justify: "start",
  gap: "16px",
  padding: "24px",
  margin: "0",
  columns: 1,
};

export const DEFAULT_STYLE: StageSectionStyle = {
  background: "transparent",
  borderRadius: "0",
  borderColor: "transparent",
  borderWidth: "0",
  shadow: "none",
  backdropBlur: "0",
};
