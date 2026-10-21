import { LearnerLanguage } from "@/components/LearnerLanguage";
import { authLocale } from "@/lib/auth-copy";
import { LearnerText } from "@/components/LearnerText";
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
import { readLearnerAccess } from "@/lib/session";
import { LearnerProgress, LessonAccess, ProgressStatus } from "@/components/academy/LearnerProgress";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{ unit: string; level: string }>;
};

export default async function AcademyLessonPage({ params }: LessonPageProps) {
  const access = await readLearnerAccess();
  if (access.kind !== "account") redirect("/");

  const { unit: unitParam, level: levelParam } = await params;
  const unitNumber = Number(unitParam);
  const levelNumber = Number(levelParam);
  if (!/^[1-9]\d{0,3}$/.test(unitParam) || !/^[1-9]\d{0,3}$/.test(levelParam)) {
    notFound();
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

  return (
    <LearnerLanguage initialLocale={authLocale(access.account.appLanguage)}><div className="learner-world learner-lesson">
      <SiteHeader signedIn />

      <LearnerProgress key={access.scope} scope={access.scope} guest={false}>
      <main id="learner-main" tabIndex={-1} className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="mb-6 text-sm text-[var(--muted)]">
          <Link
            href={`/home#${quizHash}`}
            className="underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          ><LearnerText text={"Forro Academy"} /></Link>
          <span aria-hidden="true"> / </span>
          <span><LearnerText text={"Unit"} />{unit.number}<LearnerText text={" · Lesson "} />{level.number}
          </span>
        </p>

        <div id={quizHash}>
          <LessonAccess units={units} unit={unit} level={level.number}>
          <LessonQuiz
            key={`${unit.number}:${level.number}`}
            unitNumber={unit.number}
            levelNumber={level.number}
            unitTitle={unit.title}
            unitTitlePt={unit.titlePt}
            levelTitle={level.title}
            levelTitlePt={level.titlePt}
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
    </div></LearnerLanguage>
  );
}
