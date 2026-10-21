import { apiOrigin } from "@/lib/auth";
import { parseLearningPath, type CurriculumUnit } from "@/lib/learning-path";

export async function fetchForroCurriculum(): Promise<CurriculumUnit[]> {
  const response = await fetch(
    `${apiOrigin()}/app/v1/catalog/forro/learning_path.json`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    },
  );
  if (!response.ok) {
    throw new Error(`Catalog unavailable (${response.status})`);
  }
  return parseLearningPath(await response.json());
}

