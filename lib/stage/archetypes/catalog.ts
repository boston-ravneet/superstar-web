import type { ArchetypeId } from "@/lib/stage/archetypes/types";

export interface ArchetypeCatalogEntry {
  id: ArchetypeId;
  name: string;
  description: string;
  previewColors: {
    background: string;
    primary: string;
    accent: string;
  };
}

export const ARCHETYPE_CATALOG: ArchetypeCatalogEntry[] = [
  {
    id: "field-day",
    name: "Field Day",
    description: "Bright & athletic — sky blues, round photos, energetic grid.",
    previewColors: {
      background: "#f0f9ff",
      primary: "#2563eb",
      accent: "#059669",
    },
  },
  {
    id: "midnight-creator",
    name: "Midnight Creator",
    description: "Dark creator stage — neon accents, quote block, side-by-side hero.",
    previewColors: {
      background: "#050505",
      primary: "#22d3ee",
      accent: "#fbbf24",
    },
  },
  {
    id: "studio-clean",
    name: "Studio Clean",
    description: "Minimal editorial — airy whitespace, serif headlines, single-column gallery.",
    previewColors: {
      background: "#fafafa",
      primary: "#18181b",
      accent: "#2563eb",
    },
  },
  {
    id: "gold-ledger",
    name: "Gold Ledger",
    description: "Luxury showcase — gold accents, bio-first flow, wide feature photo.",
    previewColors: {
      background: "#0c0a09",
      primary: "#f59e0b",
      accent: "#fde68a",
    },
  },
];
