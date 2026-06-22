/**
 * Local smoke test for archetype classification + template fill.
 * Run: npx tsx scripts/verify-design-engine.ts
 */
import { classifyCreator } from "../lib/ai/classify-creator";
import { buildFromArchetype } from "../lib/stage/fill-archetype";
import type { ProfileBuilderInput } from "../lib/types/stage-template";

const FIXTURES: Array<{ label: string; input: ProfileBuilderInput; expectedArchetype: string }> = [
  {
    label: "Athlete / student / blue / round",
    expectedArchetype: "field-day",
    input: {
      bio: "I'm in 8th grade at VCMS. I love football and playing games on my mobile phone.",
      designInstructions: "bright, sports vibe, round images, blue not pink",
      imageUrls: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
      ],
      displayName: "Aad Batra",
      username: "aad_batra",
      instagramHandle: "aad_batra",
      tiktokHandle: null,
    },
  },
  {
    label: "Dark creator / gaming",
    expectedArchetype: "midnight-creator",
    input: {
      bio: "Twitch streamer and content creator. Mostly gaming and tech reviews.",
      designInstructions: "dark moody neon aesthetic",
      imageUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg", "https://example.com/c.jpg"],
      displayName: "Neon Gamer",
      username: "neongamer",
    },
  },
  {
    label: "Minimal professional",
    expectedArchetype: "studio-clean",
    input: {
      bio: "Product designer helping startups ship clean interfaces.",
      designInstructions: "minimal clean professional light portfolio",
      imageUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg", "https://example.com/c.jpg"],
      displayName: "Sam Lee",
      username: "samlee",
    },
  },
  {
    label: "Luxury / music",
    expectedArchetype: "gold-ledger",
    input: {
      bio: "Independent artist and singer. R&B and soul.",
      designInstructions: "gold luxury elegant premium",
      imageUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg", "https://example.com/c.jpg"],
      displayName: "Aria Gold",
      username: "ariagold",
    },
  },
];

let passed = 0;
let failed = 0;

console.log("\n=== Superstar Design Engine — local verification ===\n");

for (const fixture of FIXTURES) {
  const classification = classifyCreator(fixture.input);
  const template = buildFromArchetype(fixture.input, classification);

  const sectionTypes = template.sections.map((s) => s.type);
  const hasHero = sectionTypes.includes("hero");
  const hasGallery = sectionTypes.includes("gallery");
  const hasBio = sectionTypes.includes("bio");
  const galleryImages = template.sections.find((s) => s.type === "gallery")?.content
    .images as unknown[];
  const imageCount = Array.isArray(galleryImages) ? galleryImages.length : 0;
  const isPinkPrimary = /#d946ef|#db2777|#ec4899/i.test(template.palette.primary);
  const archetypeOk = classification.archetypeId === fixture.expectedArchetype;
  const structureOk = hasHero && hasGallery && hasBio && imageCount === 3;
  const ok = archetypeOk && structureOk && !isPinkPrimary;

  if (ok) {
    passed += 1;
    console.log(`✅ ${fixture.label}`);
  } else {
    failed += 1;
    console.log(`❌ ${fixture.label}`);
  }

  console.log(`   archetype: ${classification.archetypeId} (expected ${fixture.expectedArchetype})`);
  console.log(`   mood: ${classification.mood} | vertical: ${classification.vertical}`);
  console.log(`   palette primary: ${template.palette.primary}`);
  console.log(`   canvas: ${template.canvas.background} → ${template.canvas.backgroundGradientTo}`);
  console.log(`   sections: ${sectionTypes.join(" → ")}`);
  console.log(`   gallery images: ${imageCount} | pink primary: ${isPinkPrimary ? "YES (bad)" : "no"}`);
  console.log("");
}

console.log(`Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
