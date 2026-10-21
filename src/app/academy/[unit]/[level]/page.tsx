import { fetchForroCurriculum } from "@/lib/catalog";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LessonQuiz } from "@/components/academy/LessonQuiz";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  findLevel,
  levelQuizSlug,
} from "@/lib/learning-path";
import { GUEST_MAX_UNIT, readLearnerAccess } from "@/lib/session";
import { LearnerProgress, LessonAccess, ProgressStatus } from "@/components/academy/LearnerProgress";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{ unit: string; level: string }>;
};

export default async function AcademyLessonPage({ params }: LessonPageProps) {
  const access = await readLearnerAccess();
  if (access.kind === null) redirect("/");

  const { unit: unitParam, level: levelParam } = await params;
  const unitNumber = Number(unitParam);
  const levelNumber = Number(levelParam);
  if (!/^[1-9]\d{0,3}$/.test(unitParam) || !/^[1-9]\d{0,3}$/.test(levelParam)) {
    notFound();
  }

  if (access.kind === "guest" && unitNumber > GUEST_MAX_UNIT) {
    redirect("/home");
  }

  let units: Awaited<ReturnType<typeof fetchForroCurriculum>> = [];
  try {
    units = await fetchForroCurriculum();
  } catch {
    notFound();
  }

  const match = findLevel(units, unitNumber, levelNumber);
  if (!match) notFound();

  const { unit, level } = match;
  const distractors = units.flatMap((item) =>
    item.levels.flatMap((entry) => entry.phrases),
  );
  const quizHash = levelQuizSlug(level.title);
  const isGuest = access.kind === "guest";

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader signedIn={access.kind === "account"} guest={isGuest} />

      <LearnerProgress key={access.scope} scope={access.scope} guest={isGuest}>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="mb-6 text-sm text-[var(--muted)]">
          <Link
            href={`/home#${quizHash}`}
            className="underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          >
            Forro Academy
          </Link>
          <span aria-hidden="true"> / </span>
          <span>
            Unit {unit.number} · Lesson {level.number}
          </span>
        </p>

        <div id={quizHash}>
          <LessonAccess unit={unit} level={level.number}>
          <LessonQuiz
            key={`${unit.number}:${level.number}`}
            unitNumber={unit.number}
            levelNumber={level.number}
            unitTitle={unit.title}
            levelTitle={level.title}
            skillFamily={level.skillFamily}
            phrases={level.phrases}
            distractors={distractors}
          />
          </LessonAccess>
        </div>
        <ProgressStatus />
      </main>
      </LearnerProgress>

      <SiteFooter />
    </div>
  );
}
