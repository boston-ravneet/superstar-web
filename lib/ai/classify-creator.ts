import type { ProfileBuilderInput } from "@/lib/types/stage-template";
import {
  combineDesignHints,
  prefersBlue,
  rejectsPink,
  wantsCircularImages,
} from "@/lib/ai/design-theme";
import {
  DEFAULT_ARCHETYPE_ID,
  getArchetypeById,
  STAGE_ARCHETYPES,
  type ArchetypeId,
  type CreatorClassification,
} from "@/lib/stage/archetypes";
import { extractInterestTags } from "@/lib/ai/bio-copy";

function isBright(hints: string): boolean {
  return /\b(bright|light|white|airy|pastel|sunny|daylight)\b/i.test(hints);
}

function isDark(hints: string): boolean {
  return /\b(dark|moody|noir|midnight|black)\b/i.test(hints);
}

function isLuxury(hints: string): boolean {
  return /\b(luxury|gold|premium|elegant|vip)\b/i.test(hints);
}

function isMinimal(hints: string): boolean {
  return /\b(minimal|clean|simple|professional)\b/i.test(hints);
}

function scoreArchetype(
  archetypeId: ArchetypeId,
  haystack: string,
  hints: string,
  interests: string[],
): { score: number; reasons: string[] } {
  const archetype = getArchetypeById(archetypeId)!;
  const reasons: string[] = [];
  let score = 0;

  if (archetype.matchKeywords.test(haystack)) {
    score += 4;
    reasons.push(`Matched ${archetype.name} keywords`);
  }

  for (const tag of interests) {
    if (archetype.matchKeywords.test(tag)) {
      score += 2;
      reasons.push(`Interest tag: ${tag}`);
    }
  }

  switch (archetypeId) {
    case "field-day":
      if (isBright(hints) || prefersBlue(hints) || rejectsPink(hints)) {
        score += 3;
        reasons.push("Bright / blue design brief");
      }
      if (wantsCircularImages(hints)) {
        score += 2;
        reasons.push("Round images requested");
      }
      if (/\b(football|sport|athlete|student|grade)\b/i.test(haystack)) {
        score += 3;
      }
      break;
    case "midnight-creator":
      if (isDark(hints)) {
        score += 3;
        reasons.push("Dark mood in brief");
      }
      if (/\b(creator|gaming|content|stream)\b/i.test(haystack)) {
        score += 3;
      }
      break;
    case "studio-clean":
      if (isMinimal(hints) || isBright(hints)) {
        score += 3;
        reasons.push("Minimal / clean brief");
      }
      break;
    case "gold-ledger":
      if (isLuxury(hints)) {
        score += 4;
        reasons.push("Luxury brief");
      }
      if (/\b(music|fashion|artist|singer)\b/i.test(haystack)) {
        score += 2;
      }
      break;
  }

  return { score, reasons };
}

function moodForArchetype(id: ArchetypeId): CreatorClassification["mood"] {
  switch (id) {
    case "field-day":
      return "bright";
    case "midnight-creator":
      return "dark";
    case "studio-clean":
      return "minimal";
    case "gold-ledger":
      return "luxury";
  }
}

function verticalFromHaystack(haystack: string): string {
  if (/\b(football|soccer|sport|athlete|basketball)\b/i.test(haystack)) {
    return "athlete";
  }
  if (/\b(music|singer|artist|rapper|band)\b/i.test(haystack)) {
    return "musician";
  }
  if (/\b(creator|content|influencer|stream)\b/i.test(haystack)) {
    return "creator";
  }
  if (/\b(student|grade|school|vcms)\b/i.test(haystack)) {
    return "student";
  }
  if (/\b(fashion|style|luxury)\b/i.test(haystack)) {
    return "fashion";
  }
  if (/\b(tech|gaming|mobile phone)\b/i.test(haystack)) {
    return "tech";
  }
  return "general";
}

/** Picks the best curated layout preset from bio, photos context, and design brief. */
export function classifyCreator(input: ProfileBuilderInput): CreatorClassification {
  const hints = combineDesignHints(input.designInstructions);
  const haystack = `${input.bio}\n${hints}`;
  const interests = extractInterestTags(input.bio, input.designInstructions);

  let bestId: ArchetypeId = DEFAULT_ARCHETYPE_ID;
  let bestScore = -1;
  let bestReasons: string[] = [];

  for (const archetype of STAGE_ARCHETYPES) {
    const { score, reasons } = scoreArchetype(
      archetype.id,
      haystack,
      hints,
      interests,
    );

    if (score > bestScore) {
      bestScore = score;
      bestId = archetype.id;
      bestReasons = reasons;
    }
  }

  if (bestScore <= 0) {
    if (isLuxury(hints)) {
      bestId = "gold-ledger";
    } else if (isDark(hints)) {
      bestId = "midnight-creator";
    } else if (isMinimal(hints) || isBright(hints)) {
      bestId = isMinimal(hints) ? "studio-clean" : "field-day";
    }
    bestReasons = ["Default archetype from design mood"];
    bestScore = 1;
  }

  const archetype = getArchetypeById(bestId)!;
  const maxPossible = 12;
  const confidence = Math.min(1, Math.max(0.35, bestScore / maxPossible));

  return {
    archetypeId: bestId,
    archetypeName: archetype.name,
    vertical: verticalFromHaystack(haystack),
    mood: moodForArchetype(bestId),
    confidence,
    matchReasons: bestReasons.slice(0, 5),
  };
}
