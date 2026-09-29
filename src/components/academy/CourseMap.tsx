import Link from "next/link";
import type { CurriculumLevel, CurriculumUnit } from "@/lib/learning-path";
import { levelQuizSlug } from "@/lib/learning-path";
import { GUEST_MAX_UNIT } from "@/lib/session";

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
};

type PathRow = {
  nodes: PathNode[];
  showUnit: boolean;
  showLockedCta: boolean;
};

/** Dialogue select_course row rhythm: 1 → 2 → 1 → 1 → 2 → … */
const ROW_SIZES = [1, 2, 1, 1, 2, 1, 1, 1, 2] as const;

function buildNodes(units: CurriculumUnit[], guestMode: boolean): PathNode[] {
  const flat: PathNode[] = [];
  for (const unit of units) {
    const locked = guestMode && unit.number > GUEST_MAX_UNIT;
    for (const level of unit.levels) {
      flat.push({
        unitNumber: unit.number,
        unitTitle: unit.title,
        level,
        locked,
        current: false,
      });
    }
  }
  const firstOpen = flat.findIndex((n) => !n.locked);
  if (firstOpen >= 0) flat[firstOpen] = { ...flat[firstOpen], current: true };
  return flat;
}

function buildRows(nodes: PathNode[], guestMode: boolean): PathRow[] {
  const chunks: PathNode[][] = [];
  let i = 0;
  let patternIndex = 0;
  while (i < nodes.length) {
    const size = ROW_SIZES[patternIndex % ROW_SIZES.length];
    chunks.push(nodes.slice(i, i + size));
    i += size;
    patternIndex += 1;
  }

  const firstLockedUnit = guestMode
    ? nodes.find((n) => n.locked)?.unitNumber ?? null
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

function LessonGlyph({
  levelNumber,
  locked,
}: {
  levelNumber: number;
  locked: boolean;
}) {
  const stroke = locked ? "#9aa39c" : "#1f7a4d";
  const fill = locked ? "#e8ece9" : "#eef6f1";
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <rect x="6" y="6" width="108" height="108" rx="38" fill={fill} />
      <circle
        cx="60"
        cy="60"
        r="32"
        fill="white"
        stroke={stroke}
        strokeWidth="3.5"
      />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fill={stroke}
        fontSize="28"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {levelNumber}
      </text>
    </svg>
  );
}

function PathTile({ node }: { node: PathNode }) {
  const { level, unitNumber, locked, current } = node;
  const quizSlug = levelQuizSlug(level.title);
  const href = `/academy/${unitNumber}/${level.number}#${quizSlug}`;

  const labelClass = locked
    ? "text-[#adadad]"
    : current
      ? "text-[#bf9d2e]"
      : "text-[#808080]";

  const body = (
    <>
      <span
        className={`block h-[7.25rem] w-[7.25rem] overflow-hidden rounded-[35%] sm:h-[9.5rem] sm:w-[9.5rem] ${
          locked ? "opacity-50" : "shadow-[0_1px_0_rgba(15,26,20,0.04)]"
        } ${!locked ? "transition-transform group-hover:-translate-y-0.5" : ""}`}
      >
        <LessonGlyph levelNumber={level.number} locked={locked} />
      </span>
      <span
        className={`mt-3 max-w-[11rem] text-center text-[15px] font-semibold leading-snug tracking-tight sm:text-[19px] ${labelClass}`}
      >
        {level.title}
      </span>
      {locked ? (
        <span className="mt-1 text-xs font-medium text-[#adadad]">Locked</span>
      ) : null}
    </>
  );

  if (locked) {
    return (
      <div
        id={quizSlug}
        className="flex w-[11.5rem] flex-col items-center px-1 sm:w-[12rem]"
        title="Create an account to unlock"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      id={quizSlug}
      href={href}
      className="group flex w-[11.5rem] flex-col items-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/35 sm:w-[12rem]"
    >
      {body}
    </Link>
  );
}

export function CourseMap({ units, guestMode = false }: CourseMapProps) {
  if (units.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        The Forro Academy path is not available right now. Try again shortly, or
        continue in the iOS app.
      </p>
    );
  }

  const rows = buildRows(buildNodes(units, guestMode), guestMode);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 pb-8 pt-2 sm:gap-10">
      {rows.map((row, rowIndex) => {
        const lead = row.nodes[0];
        return (
          <div key={`row-${rowIndex}`} className="w-full">
            {row.showUnit ? (
              <div className="mb-5 flex justify-center">
                <p className="rounded-full bg-white px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)] shadow-sm">
                  Unit {lead.unitNumber}
                  <span className="mx-1.5 text-[var(--border)]">·</span>
                  <span className="normal-case tracking-normal text-[var(--muted)]">
                    {lead.unitTitle}
                  </span>
                  {lead.locked ? (
                    <span className="ml-2 normal-case tracking-normal text-[#adadad]">
                      · locked
                    </span>
                  ) : null}
                </p>
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
                  href="/create-account"
                  className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
                >
                  Create account to unlock
                </Link>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
