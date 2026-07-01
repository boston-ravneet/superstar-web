import { sanitizeSkillTags } from "@/lib/ai/bio-copy";

export interface RichBioHighlight {
  title: string;
  body: string;
}

export interface RichBioParseResult {
  isRich: boolean;
  summary: string;
  technicalSkills: string[];
  experience: RichBioHighlight[];
  education: RichBioHighlight[];
}

const RICH_MARKERS =
  /\b(technical skills|work experience|education:|project annexure|organization:)/i;

const EXPERIENCE_DATE =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)['']?\s*\d{2}\s*[–—-]\s*(?:till date|present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)['']?\s*\d{2}|\d{4}))/i;

function normalizeWhitespace(value: string): string {
  return value.replace(/\t+/g, " ").replace(/\s+/g, " ").trim();
}

function extractSummary(bio: string): string {
  const markers = [
    "Technical Skills",
    "Work Experience",
    "Education:",
    "Project Annexure",
    "Organization:",
  ];

  let summary = bio.trim();
  for (const marker of markers) {
    const index = summary.search(new RegExp(marker, "i"));
    if (index > 120) {
      summary = summary.slice(0, index).trim();
      break;
    }
  }

  const sentences = summary.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [summary];
  return normalizeWhitespace(sentences.slice(0, 3).join(" ")).slice(0, 650);
}

function extractTechnicalSkills(bio: string): string[] {
  const block =
    bio.match(
      /Technical Skills[\s\S]*?(?=Education:|Work Experience:|Project Annexure:|Organization:|$)/i,
    )?.[0] ?? "";

  if (!block) {
    return [];
  }

  const skills: string[] = [];
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || /^technical skills:?$/i.test(trimmed)) {
      continue;
    }

    if (/^(programming|platforms|databases|flash|javascript|version|automation|documentation|messaging|reporting)/i.test(trimmed)) {
      continue;
    }

    if (trimmed.includes(",")) {
      skills.push(
        ...trimmed
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part.length > 1 && part.length < 28),
      );
      continue;
    }

    if (trimmed.length > 1 && trimmed.length < 28 && !/:$/.test(trimmed)) {
      skills.push(trimmed);
    }
  }

  return [...new Set(skills)].slice(0, 12);
}

function extractExperience(bio: string): RichBioHighlight[] {
  const block =
    bio.match(
      /Work Experience:[\s\S]*?(?=Project Annexure:|Organization:|Education:|$)/i,
    )?.[0] ?? "";

  if (!block) {
    return [];
  }

  const items: RichBioHighlight[] = [];

  for (const rawLine of block.split("\n")) {
    const line = normalizeWhitespace(rawLine);
    if (line.length < 12 || /^work experience:?$/i.test(line)) {
      continue;
    }

    const dateMatch = line.match(EXPERIENCE_DATE);
    if (!dateMatch || dateMatch.index === undefined) {
      continue;
    }

    const title = line.slice(0, dateMatch.index).trim().replace(/\s{2,}/g, " · ");
    if (title.length < 8) {
      continue;
    }

    items.push({
      title: title.slice(0, 110),
      body: dateMatch[1].trim(),
    });
  }

  return items.slice(0, 6);
}

function extractEducation(bio: string): RichBioHighlight[] {
  const block =
    bio.match(/Education:[\s\S]*?(?=Work Experience:|Project Annexure:|Organization:|$)/i)?.[0] ??
    "";

  if (!block) {
    return [];
  }

  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 12 &&
        !/^education:?$/i.test(line) &&
        /university|b\.c\.a|b\.ca|m\.i\.t|bachelor|master|degree|college/i.test(
          line,
        ),
    )
    .slice(0, 4)
    .map((line) => ({
      title: line.match(/^([^(]+(?:University|Application|College)[^(]*)/i)?.[1]?.trim() ||
        line.slice(0, 60),
      body: line,
    }));
}

export function parseRichBio(bio: string): RichBioParseResult {
  const trimmed = bio.trim();
  const isRich = trimmed.length > 500 || RICH_MARKERS.test(trimmed);

  if (!isRich) {
    return {
      isRich: false,
      summary: trimmed,
      technicalSkills: [],
      experience: [],
      education: [],
    };
  }

  const technicalSkills = sanitizeSkillTags(extractTechnicalSkills(trimmed));
  const experience = extractExperience(trimmed);
  const education = extractEducation(trimmed);

  return {
    isRich: true,
    summary: extractSummary(trimmed),
    technicalSkills,
    experience,
    education,
  };
}
