/**
 * Live Gemini generation smoke test (uses GEMINI_API_KEY from .dev.vars).
 * Run: npx tsx scripts/verify-design-engine-live.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateStageTemplate } from "../lib/ai/generate-stage-template";
import type { ProfileBuilderInput } from "../lib/types/stage-template";

function loadDevVars(): Record<string, string> {
  const path = resolve(process.cwd(), ".dev.vars");
  const lines = readFileSync(path, "utf8").split("\n");
  const out: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const input: ProfileBuilderInput = {
  bio: "I'm in 8th grade at VCMS. I love football and playing games on my mobile phone.",
  designInstructions: "bright, sports vibe, round images, blue not pink",
  imageUrls: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400",
  ],
  displayName: "Aad Batra",
  username: "aad_batra_test",
  instagramHandle: "aad_batra",
};

async function main() {
  const vars = loadDevVars();
  const apiKey = vars.GEMINI_API_KEY;

  console.log("\n=== Live Gemini generation test ===\n");
  console.log(`API key present: ${Boolean(apiKey?.trim())}`);

  const result = await generateStageTemplate(input, { apiKey });

  console.log(`Source: ${result.source}`);
  if (result.error) {
    console.log(`Error/fallback note: ${result.error}`);
  }

  const t = result.template;
  console.log(`Archetype palette primary: ${t.palette.primary}`);
  console.log(`Canvas: ${t.canvas.background}`);
  console.log(`Assets: avatar=${t.assets?.avatarBorderRadius} gallery=${t.assets?.galleryImageBorderRadius}`);
  console.log(`Sections: ${t.sections.map((s) => s.type).join(" → ")}`);

  const hero = t.sections.find((s) => s.type === "hero");
  console.log(`Hero subheadline: ${String(hero?.content.subheadline ?? "").slice(0, 100)}`);

  const isPink = /#d946ef|#db2777|#ec4899/i.test(t.palette.primary);
  const ok =
    t.sections.length >= 5 &&
    !isPink &&
    (result.source === "gemini" || result.source === "fallback");

  console.log(`\n${ok ? "✅ Live generation OK" : "❌ Live generation FAILED"}\n`);
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
