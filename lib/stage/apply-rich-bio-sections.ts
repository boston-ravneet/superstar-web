import type {
  StageTemplateDocument,
  StageTemplateSection,
} from "@/lib/types/stage-template";
import { DEFAULT_LAYOUT, DEFAULT_STYLE } from "@/lib/stage/template-defaults";
import { parseRichBio } from "@/lib/stage/parse-rich-bio";

function buildHighlightsSection(
  id: string,
  title: string,
  order: number,
  items: Array<{ title: string; body: string }>,
): StageTemplateSection {
  return {
    id,
    type: "highlights",
    order,
    visible: items.length > 0,
    layout: {
      ...DEFAULT_LAYOUT,
      display: "grid",
      columns: 1,
      gap: "12px",
      padding: "0 24px 20px",
    },
    style: {
      ...DEFAULT_STYLE,
      background: "transparent",
      borderWidth: "0",
    },
    content: {
      title,
      items,
    },
  };
}

/** Expands résumé-style bios into summary + experience/education highlight sections. */
export function applyRichBioSections(
  template: StageTemplateDocument,
  bio: string,
): StageTemplateDocument {
  const parsed = parseRichBio(bio);
  if (!parsed.isRich) {
    return template;
  }

  let sections = template.sections.filter(
    (section) =>
      section.id !== "highlights-experience" &&
      section.id !== "highlights-education",
  );

  sections = sections.map((section) => {
    if (section.type === "bio" && parsed.summary) {
      return {
        ...section,
        content: {
          ...section.content,
          text: parsed.summary,
        },
      };
    }

    if (section.type === "skills" && parsed.technicalSkills.length > 0) {
      const existing = Array.isArray(section.content.tags)
        ? (section.content.tags as string[])
        : [];
      const merged = [...new Set([...parsed.technicalSkills, ...existing])].slice(
        0,
        10,
      );

      return {
        ...section,
        visible: merged.length > 0,
        content: {
          ...section.content,
          title: section.content.title ?? "Technical Skills",
          tags: merged,
        },
      };
    }

    return section;
  });

  const bioOrder =
    sections.find((section) => section.type === "bio")?.order ?? 3;
  const insertOrder = bioOrder + 0.1;
  const newSections: StageTemplateSection[] = [];

  if (parsed.experience.length >= 2) {
    newSections.push(
      buildHighlightsSection(
        "highlights-experience",
        "Experience",
        insertOrder,
        parsed.experience,
      ),
    );
  }

  if (parsed.education.length > 0) {
    newSections.push(
      buildHighlightsSection(
        "highlights-education",
        "Education",
        insertOrder + 0.1,
        parsed.education,
      ),
    );
  }

  if (newSections.length === 0) {
    return { ...template, sections };
  }

  sections = [...sections, ...newSections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index }));

  return {
    ...template,
    sections,
  };
}
