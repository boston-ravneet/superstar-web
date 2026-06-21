import type { ThemeTemplate } from "@/lib/types/layout";

export interface StageThemeClasses {
  page: string;
  heroGlow: string;
  accentText: string;
  sectionLabel: string;
  card: string;
  cta: string;
}

export const STAGE_THEME_MAP: Record<ThemeTemplate, StageThemeClasses> = {
  "midnight-gold": {
    page: "bg-[#050505] text-white",
    heroGlow:
      "bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(217,70,239,0.14),_transparent_35%)]",
    accentText: "text-amber-200",
    sectionLabel: "text-fuchsia-300/80",
    card: "border-zinc-800 bg-gradient-to-b from-zinc-950 to-black",
    cta: "from-fuchsia-500 via-purple-500 to-indigo-500",
  },
  "neon-fuchsia": {
    page: "bg-[#07000f] text-white",
    heroGlow:
      "bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.22),_transparent_45%),radial-gradient(circle_at_20%_30%,_rgba(34,211,238,0.12),_transparent_35%)]",
    accentText: "text-fuchsia-300",
    sectionLabel: "text-cyan-300/80",
    card: "border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-950/40 to-black",
    cta: "from-fuchsia-400 via-pink-500 to-purple-600",
  },
  "clean-slate": {
    page: "bg-[#0f1115] text-zinc-100",
    heroGlow:
      "bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_45%)]",
    accentText: "text-slate-300",
    sectionLabel: "text-slate-400",
    card: "border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950",
    cta: "from-slate-200 via-slate-300 to-slate-400 text-slate-950",
  },
  "cinema-noir": {
    page: "bg-black text-zinc-100",
    heroGlow:
      "bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.12),_transparent_40%),radial-gradient(circle_at_70%_20%,_rgba(255,255,255,0.05),_transparent_35%)]",
    accentText: "text-red-300",
    sectionLabel: "text-red-400/80",
    card: "border-red-950 bg-gradient-to-b from-zinc-950 to-black",
    cta: "from-red-600 via-red-500 to-orange-500",
  },
};

export function getStageTheme(theme: ThemeTemplate): StageThemeClasses {
  return STAGE_THEME_MAP[theme];
}
