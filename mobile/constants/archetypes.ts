export type ArchetypeId =
  | "field-day"
  | "midnight-creator"
  | "studio-clean"
  | "gold-ledger";

export interface ArchetypeOption {
  id: ArchetypeId;
  name: string;
  description: string;
  previewColors: {
    background: string;
    primary: string;
    accent: string;
  };
}

export const ARCHETYPE_OPTIONS: ArchetypeOption[] = [
  {
    id: "field-day",
    name: "Field Day",
    description: "Bright & athletic — sky blues, round photos.",
    previewColors: {
      background: "#f0f9ff",
      primary: "#2563eb",
      accent: "#059669",
    },
  },
  {
    id: "midnight-creator",
    name: "Midnight Creator",
    description: "Dark creator — neon accents, quote block.",
    previewColors: {
      background: "#050505",
      primary: "#22d3ee",
      accent: "#fbbf24",
    },
  },
  {
    id: "studio-clean",
    name: "Studio Clean",
    description: "Minimal editorial — airy, serif headlines.",
    previewColors: {
      background: "#fafafa",
      primary: "#18181b",
      accent: "#2563eb",
    },
  },
  {
    id: "gold-ledger",
    name: "Gold Ledger",
    description: "Luxury showcase — gold accents, feature photo.",
    previewColors: {
      background: "#0c0a09",
      primary: "#f59e0b",
      accent: "#fde68a",
    },
  },
];
