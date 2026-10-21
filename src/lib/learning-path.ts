export type PathPhrase = {
  id: string;
  forro: string;
  english: string;
  portuguese: string;
};

/** Skill family on an existing Forro level. */
export type SkillFamily =
  | "vocab"
  | "phrase"
  | "grammar"
  | "culture"
  | "dialogue";

export type CurriculumLevel = {
  number: number;
  title: string;
  titlePt: string;
  skillFamily: SkillFamily;
  phrases: PathPhrase[];
};

export type CurriculumUnit = {
  number: number;
  title: string;
  titlePt: string;
  subtitle: string;
  subtitlePt: string;
  levels: CurriculumLevel[];
};

type RawEntry = {
  id?: string;
  kind?: string;
  forro_text?: string;
  translation_en?: string;
  translation_pt?: string;
  unit_number?: number | string;
  unit_title?: string;
  unit_title_pt?: string;
  unit_subtitle?: string;
  unit_subtitle_pt?: string;
  level_number?: number | string;
  level_title?: string;
  level_title_pt?: string;
  skill_family?: string;
  sort?: number | string;
};

const SKILL_FAMILIES = new Set<SkillFamily>([
  "vocab",
  "phrase",
  "grammar",
  "culture",
  "dialogue",
]);

function parseSkillFamily(raw: unknown): SkillFamily {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return SKILL_FAMILIES.has(value as SkillFamily)
    ? (value as SkillFamily)
    : "phrase";
}

function asInt(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string") {
    const n = /^\d+$/.test(value) ? Number(value) : 0;
    return Number.isSafeInteger(n) ? n : 0;
  }
  return 0;
}

export function parseLearningPath(payload: unknown): CurriculumUnit[] {
  if (!payload || typeof payload !== "object") return [];
  const entries = (payload as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return [];

  const rows = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const row = entry as RawEntry;
      if (typeof row.id !== "string" || !row.id.trim() || typeof row.forro_text !== "string" || typeof row.translation_en !== "string") return null;
      if (row.kind && row.kind !== "path") return null;
      const forro = String(row.forro_text ?? "").trim();
      const english = String(row.translation_en ?? "").trim();
      if (!forro || !english) return null;
      const unitNumber = asInt(row.unit_number);
      const levelNumber = asInt(row.level_number);
      if (unitNumber < 1 || levelNumber < 1) return null;
      return {
        id: String(row.id ?? "").trim(),
        forro,
        english,
        portuguese: String(row.translation_pt ?? "").trim() || english,
        unitNumber,
        unitTitle: String(row.unit_title ?? "").trim(),
        unitTitlePt: String(row.unit_title_pt ?? "").trim(),
        unitSubtitle: String(row.unit_subtitle ?? "").trim(),
        unitSubtitlePt: String(row.unit_subtitle_pt ?? "").trim(),
        levelNumber,
        levelTitle: String(row.level_title ?? "").trim(),
        levelTitlePt: String(row.level_title_pt ?? "").trim(),
        skillFamily: parseSkillFamily(row.skill_family),
        sort: asInt(row.sort),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const byUnit = new Map<number, typeof rows>();
  for (const row of rows) {
    const list = byUnit.get(row.unitNumber) ?? [];
    list.push(row);
    byUnit.set(row.unitNumber, list);
  }

  return [...byUnit.entries()]
    .sort(([a], [b]) => a - b)
    .map(([unitNumber, unitRows]) => {
      const first = unitRows[0];
      const byLevel = new Map<number, typeof unitRows>();
      for (const row of unitRows) {
        const list = byLevel.get(row.levelNumber) ?? [];
        list.push(row);
        byLevel.set(row.levelNumber, list);
      }
      const levels = [...byLevel.entries()]
        .sort(([a], [b]) => a - b)
        .map(([levelNumber, levelRows]) => {
          const levelFirst = levelRows[0];
          const phrases = [...levelRows]
            .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))
            .map((row) => ({
              id: row.id || `u${unitNumber}-l${levelNumber}-${row.sort}`,
              forro: row.forro,
              english: row.english,
              portuguese: row.portuguese,
            }));
          return {
            number: levelNumber,
            title: levelFirst.levelTitle || `Level ${levelNumber}`,
            titlePt: levelFirst.levelTitlePt,
            skillFamily: levelFirst.skillFamily,
            phrases,
          };
        });

      return {
        number: unitNumber,
        title: first.unitTitle || `Unit ${unitNumber}`,
        titlePt: first.unitTitlePt,
        subtitle: first.unitSubtitle,
        subtitlePt: first.unitSubtitlePt,
        levels,
      };
    });
}


export function findLevel(
  units: CurriculumUnit[],
  unitNumber: number,
  levelNumber: number,
): { unit: CurriculumUnit; level: CurriculumLevel } | null {
  const unit = units.find((item) => item.number === unitNumber);
  if (!unit) return null;
  const level = unit.levels.find((item) => item.number === levelNumber);
  if (!level) return null;
  return { unit, level };
}

/** Slug for deep links, e.g. hello-and-goodbye_quiz */
export function levelQuizSlug(levelTitle: string): string {
  const base = levelTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
  return `${base || "lesson"}_quiz`;
}
