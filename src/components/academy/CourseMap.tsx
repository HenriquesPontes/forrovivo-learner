"use client";

import { LearnerText, useLearnerCopy } from "@/components/LearnerText";


import Link from "next/link";
import Image from "next/image";
import type { CurriculumLevel, CurriculumUnit } from "@/lib/learning-path";
import { levelQuizSlug } from "@/lib/learning-path";
import { GUEST_MAX_UNIT } from "@/lib/validation";
import { useLearnerProgress } from "@/components/academy/LearnerProgress";
import { completedCount, lessonAvailable, type LessonResult, type UnitProgress } from "@/lib/progress";

type CourseMapProps = {
  units: CurriculumUnit[];
  guestMode?: boolean;
};

type PathNode = {
  unitNumber: number;
  unitTitle: string;
  level: CurriculumLevel;
  locked: boolean;
  current: boolean;
  completed: boolean;
  guestLocked: boolean;
};

type PathRow = {
  nodes: PathNode[];
  showUnit: boolean;
  showLockedCta: boolean;
};

/** Course-map row rhythm: 1 → 2 → 1 → 1 → 2 → … */
const ROW_SIZES = [1, 2, 1, 1, 2, 1, 1, 1, 2] as const;

function buildNodes(units: CurriculumUnit[], guestMode: boolean, rows: UnitProgress[], local: LessonResult[]): PathNode[] {
  const flat: PathNode[] = [];
  for (const unit of units) {
    const guestLocked = guestMode && unit.number > GUEST_MAX_UNIT;
    const count = completedCount(unit, rows, local);
    for (const [position, level] of unit.levels.entries()) {
      flat.push({
        unitNumber: unit.number,
        unitTitle: unit.title,
        level,
        locked: guestLocked || !lessonAvailable(unit, level.number, rows, local, units),
        current: false,
        completed: position < count,
        guestLocked,
      });
    }
  }
  const firstOpen = flat.findIndex((n) => !n.locked && !n.completed);
  if (firstOpen >= 0) flat[firstOpen] = { ...flat[firstOpen], current: true };
  return flat;
}

function buildRows(nodes: PathNode[], guestMode: boolean): PathRow[] {
  const chunks: PathNode[][] = [];
  let i = 0;
  let patternIndex = 0;
  while (i < nodes.length) {
    const desired = ROW_SIZES[patternIndex % ROW_SIZES.length];
    let size = 1;
    while (size < desired && i + size < nodes.length && nodes[i + size].unitNumber === nodes[i].unitNumber) size++;
    chunks.push(nodes.slice(i, i + size));
    i += size;
    patternIndex += 1;
  }

  const firstLockedUnit = guestMode
    ? nodes.find((n) => n.guestLocked)?.unitNumber ?? null
    : null;

  let lastUnit = 0;
  let lockedCtaShown = false;

  return chunks.map((rowNodes) => {
    const lead = rowNodes[0];
    const showUnit = lead.unitNumber !== lastUnit;
    if (showUnit) lastUnit = lead.unitNumber;

    const showLockedCta =
      firstLockedUnit !== null &&
      !lockedCtaShown &&
      lead.unitNumber === firstLockedUnit;
    if (showLockedCta) lockedCtaShown = true;

    return { nodes: rowNodes, showUnit, showLockedCta };
  });
}

function PathTile({ node }: { node: PathNode }) {
  const { locale, tr } = useLearnerCopy();
  const { level, unitNumber, locked, current } = node;
  const artworkIndex = (unitNumber - 1) * 5 + level.number - 1;
  const quizSlug = levelQuizSlug(level.title);
  const href = `/academy/${unitNumber}/${level.number}#${quizSlug}`;

  const labelClass = locked
    ? "text-[#79836f]"
    : current
      ? "text-[#365526]"
      : "text-[#526948]";

  const body = (
    <>
      <span
        className={`learner-node-icon block h-[7.25rem] w-[7.25rem] overflow-hidden rounded-[35%] sm:h-[9.5rem] sm:w-[9.5rem] ${
          locked ? "opacity-50" : "shadow-[0_1px_0_rgba(15,26,20,0.04)]"
        } ${!locked ? "transition-transform group-hover:-translate-y-0.5" : ""}`}
      >
        <span className="learner-node-art" aria-hidden="true" style={{ backgroundImage: `url(/images/learning-path/nodes/lesson-${artworkIndex + 1}.webp)` }} />
        <span className="learner-node-number" aria-hidden="true">{node.completed ? "✓" : level.number}</span>
      </span>
      <span
        className={`mt-3 max-w-[11rem] text-center text-[15px] font-semibold leading-snug tracking-tight sm:text-[19px] ${labelClass}`}
      >
        {locale === "pt" ? level.titlePt || level.title : level.title}
      </span>
      {current && <span className="learner-start-label"><LearnerText text={"Start lesson "} /><span aria-hidden="true">→</span></span>}
      {node.completed ? <span className="mt-1 text-xs font-semibold text-[var(--brand)]"><LearnerText text={"Completed"} /></span> : locked ? (
        <span className="mt-1 text-xs font-medium text-[#adadad]"><LearnerText text={"Locked"} /></span>
      ) : null}
    </>
  );

  if (locked) {
    return (
      <div
        id={quizSlug}
        className={`learner-path-tile is-locked node-theme-${(unitNumber - 1) % 4}`}
        title={tr(node.guestLocked ? "Create an account to unlock" : "Finish the earlier lessons first")}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      id={quizSlug}
      href={href}
      aria-label={locale === "pt" ? level.titlePt || level.title : level.title}
      className={`learner-path-tile group node-theme-${(unitNumber - 1) % 4} ${current ? "is-current" : ""} ${node.completed ? "is-complete" : ""}`}
    >
      {body}
    </Link>
  );
}

export function CourseMap({ units, guestMode = false }: CourseMapProps) {
  const { locale } = useLearnerCopy();
  const progress = useLearnerProgress();
  if (!progress.ready) return <p className="text-center text-sm" role="status"><LearnerText text={"Loading saved progress…"} /></p>;
  if (units.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]"><LearnerText text={"The Forro Academy path is not available right now. Try again shortly, or continue in the iOS app."} /></p>
    );
  }

  const nodes = buildNodes(units, guestMode, progress.rows, progress.results);
  const rows = buildRows(nodes, guestMode);

  const nextLesson = nodes.find(node => node.current);

  return (
    <div className="learner-course-navigation">
      {nextLesson && <Link className="learner-resume" href={`/academy/${nextLesson.unitNumber}/${nextLesson.level.number}#${levelQuizSlug(nextLesson.level.title)}`}>
        <span className="learner-resume-play" aria-hidden="true">▶</span>
        <span><small><LearnerText text={"CONTINUE LEARNING · UNIT "} />{nextLesson.unitNumber}</small><strong>{locale === "pt" ? nextLesson.level.titlePt || nextLesson.level.title : nextLesson.level.title}</strong></span>
        <span aria-hidden="true">→</span>
      </Link>}
    <div className="learner-course-map">
      {rows.map((row, rowIndex) => {
        const lead = row.nodes[0];
        return (
          <div key={`row-${rowIndex}`} className={`learner-path-row node-theme-${(lead.unitNumber - 1) % 4}`}>
            {row.showUnit ? (
              <div className="learner-unit-scene" id={`course-unit-${lead.unitNumber}`} tabIndex={-1}>
                <Image src={`/images/learning-path/nodes/lesson-${lead.unitNumber % 2 ? 64 : 51}.webp`} width={100} height={100} alt="" aria-hidden="true" className="learner-scene-prop learner-scene-left" />
                <div className="learner-unit-sign"><p className="learner-unit-banner"><LearnerText text={"Unit"} />{lead.unitNumber}
                  <span className="mx-1.5 text-[var(--border)]">·</span>
                  <span className="normal-case tracking-normal text-[var(--muted)]">
                    {locale === "pt" ? units.find(unit => unit.number === lead.unitNumber)?.titlePt || lead.unitTitle : lead.unitTitle}
                  </span>
                  {lead.locked ? (
                    <span className="ml-2 normal-case tracking-normal text-[#adadad]"><LearnerText text={"· locked"} /></span>
                  ) : null}
                </p><span className="learner-unit-count">{nodes.filter(node => node.unitNumber === lead.unitNumber && node.completed).length} / {units.find(unit => unit.number === lead.unitNumber)?.levels.length ?? 0}<LearnerText text={" lessons completed"} /></span></div>
                <Image src={`/images/learning-path/nodes/lesson-${lead.unitNumber % 2 ? 51 : 64}.webp`} width={85} height={85} alt="" aria-hidden="true" className="learner-scene-prop learner-scene-right" />
              </div>
            ) : null}

            <div
              className={`flex flex-wrap items-start justify-center ${
                row.nodes.length === 2 ? "gap-6 sm:gap-10" : ""
              }`}
            >
              {row.nodes.map((node) => (
                <PathTile
                  key={`${node.unitNumber}-${node.level.number}`}
                  node={node}
                />
              ))}
            </div>

            {row.showLockedCta ? (
              <p className="mt-4 text-center text-sm text-[var(--muted)]">
                <Link
                  href="/"
                  className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
                ><LearnerText text={"Sign in to unlock"} /></Link>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
    </div>
  );
}
