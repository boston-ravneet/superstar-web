const INTEREST_PATTERNS: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /\b(developer|engineer|architect|javascript|typescript|react|angular|frontend|front-end|software)\b/i, tag: "Front-End Dev" },
  { pattern: /\bfootball\b|\bsoccer\b|\bquarterback\b|\bathlete\b/i, tag: "Football" },
  {
    pattern: /\bmobile phones?\b|\bsmartphones?\b|\bplay(?:ing)? on phone\b|\bphone games?\b/i,
    tag: "Mobile Gaming",
  },
  { pattern: /\bstudent\b|\bgrade\b|\bschool\b|\bvcms\b/i, tag: "Student" },
  { pattern: /\bbasketball\b/i, tag: "Basketball" },
  { pattern: /\bmusic\b|\bsinger\b|\bartist\b/i, tag: "Music" },
  { pattern: /\bfashion\b|\bstyle\b/i, tag: "Fashion" },
  { pattern: /\bfitness\b|\btraining\b|\bcoach\b/i, tag: "Fitness" },
  { pattern: /\btravel\b|\badventure\b/i, tag: "Travel" },
  { pattern: /\bphotography\b|\bphoto\b/i, tag: "Photography" },
  { pattern: /\bgaming\b|\bgamer\b|\bvideo games?\b/i, tag: "Gaming" },
  { pattern: /\btech\b|\bgadgets?\b/i, tag: "Technology" },
  { pattern: /\bcreator\b|\bcontent\b|\binfluencer\b/i, tag: "Content Creation" },
];

function capitalizeSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function firstSentence(text: string, maxLength = 140): string {
  const match = text.trim().match(/^[\s\S]+?[.!?](?:\s|$)/);
  const sentence = match ? match[0].trim() : text.trim();
  if (sentence.length <= maxLength) {
    return capitalizeSentence(sentence);
  }
  return `${capitalizeSentence(sentence.slice(0, maxLength - 1).trim())}…`;
}

export function sanitizeSkillTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(isProfessionalTag))].slice(0, 6);
}

function isProfessionalTag(tag: string): boolean {
  if (!tag || tag.length < 2 || tag.length > 22) {
    return false;
  }
  if (/^(I|I'm|I am|my|the|and|recently)\b/i.test(tag)) {
    return false;
  }
  if (/\b(love|like|started|going in|this year)\b/i.test(tag)) {
    return false;
  }
  if (tag.split(/\s+/).length > 3) {
    return false;
  }
  return true;
}

export function extractInterestTags(bio: string, designInstructions?: string): string[] {
  const haystack = `${bio}\n${designInstructions ?? ""}`;
  return sanitizeSkillTags(
    INTEREST_PATTERNS.filter(({ pattern }) => pattern.test(haystack)).map(
      ({ tag }) => tag,
    ),
  );
}

function formatInterestList(tags: string[]): string {
  const interests = tags.filter((tag) => tag !== "Student");
  if (interests.length === 0) {
    return "";
  }
  if (interests.length === 1) {
    return interests[0].toLowerCase();
  }
  if (interests.length === 2) {
    return `${interests[0].toLowerCase()} and ${interests[1].toLowerCase()}`;
  }
  return `${interests.slice(0, -1).join(", ").toLowerCase()}, and ${interests.at(-1)!.toLowerCase()}`;
}

/** Local rewrite when Gemini is unavailable — produces clearly different copy from raw bio. */
export function rewriteBioLocally(
  bio: string,
  displayName?: string,
): { tagline: string; about: string; tags: string[] } {
  const cleaned = bio.trim().replace(/\s+/g, " ");
  const tags = extractInterestTags(cleaned);
  const firstName = (displayName?.trim().split(/\s+/)[0] || "This creator").replace(
    /^./,
    (char) => char.toUpperCase(),
  );

  const gradeMatch = cleaned.match(/\b(\d+(?:st|nd|rd|th)?)\s*grade\b/i);
  const schoolMatch = cleaned.match(/\b([A-Z][A-Z0-9]{1,8})\b/);
  const interestList = formatInterestList(tags);

  const sentences: string[] = [];

  if (gradeMatch && schoolMatch) {
    sentences.push(
      `${firstName} is a ${gradeMatch[1]} grade student at ${schoolMatch[1]}.`,
    );
  } else if (gradeMatch) {
    sentences.push(`${firstName} is a ${gradeMatch[1]} grade student.`);
  } else if (/\bstudent\b/i.test(cleaned)) {
    sentences.push(`${firstName} is a dedicated student focused on growth and learning.`);
  }

  if (interestList) {
    sentences.push(`Passionate about ${interestList}.`);
  }

  if (/\bstarted\b|\brecently\b/i.test(cleaned) && tags.includes("Football")) {
    sentences.push("Recently took up football and is building skills on the field.");
  }

  if (sentences.length === 0) {
    const tagsOnly = extractInterestTags(cleaned);
    return {
      tagline: firstSentence(cleaned, 100),
      about: capitalizeSentence(
        cleaned.endsWith(".") ? cleaned : `${cleaned}.`,
      ),
      tags: tagsOnly,
    };
  }

  const tagline = sentences[0] ?? firstSentence(cleaned, 100);
  const about = sentences.join(" ");

  return { tagline, about, tags };
}

export function summarizeBioProfessionally(
  bio: string,
  displayName?: string,
): {
  tagline: string;
  about: string;
  tags: string[];
} {
  return rewriteBioLocally(bio, displayName);
}

export function isSameBioText(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase().replace(/[.!?]+$/g, "");
  return normalize(a) === normalize(b);
}
