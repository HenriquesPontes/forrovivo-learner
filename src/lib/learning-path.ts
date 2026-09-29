import { apiOrigin } from "@/lib/auth";

export type PathPhrase = {
  id: string;
  forro: string;
  english: string;
  portuguese: string;
};

export type CurriculumLevel = {
  number: number;
  title: string;
  titlePt: string;
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
  sort?: number | string;
};

function asInt(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function parseLearningPath(payload: unknown): CurriculumUnit[] {
  if (!payload || typeof payload !== "object") return [];
  const entries = (payload as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return [];

  const rows = entries
    .map((entry) => {
      const row = entry as RawEntry;
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

export async function fetchForroCurriculum(): Promise<CurriculumUnit[]> {
  const response = await fetch(
    `${apiOrigin()}/app/v1/catalog/forro/learning_path.json`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    },
  );
  if (!response.ok) {
    throw new Error(`Catalog unavailable (${response.status})`);
  }
  return parseLearningPath(await response.json());
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

/** Dialogue-Africa-style slug for deep links, e.g. hello-and-goodbye_quiz */
export function levelQuizSlug(levelTitle: string): string {
  const base = levelTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
  return `${base || "lesson"}_quiz`;
}
