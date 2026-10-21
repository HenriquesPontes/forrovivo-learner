"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { PathPhrase, SkillFamily } from "@/lib/learning-path";
import { useLearnerProgress } from "@/components/academy/LearnerProgress";
import type { LessonResult } from "@/lib/progress";

type LessonQuizProps = {
  unitNumber: number;
  levelNumber: number;
  unitTitle: string;
  levelTitle: string;
  skillFamily?: SkillFamily;
  phrases: PathPhrase[];
  distractors: PathPhrase[];
};

type QuestionKind = "translate" | "reverse" | "assemble" | "dialogue";

type ChoiceQuestion = {
  kind: "translate" | "reverse";
  phrase: PathPhrase;
  prompt: string;
  promptLabel: string;
  options: string[];
  answer: string;
};

type AssembleQuestion = {
  kind: "assemble";
  phrase: PathPhrase;
  prompt: string;
  promptLabel: string;
  bank: string[];
  answer: string;
};

type DialogueQuestion = {
  kind: "dialogue";
  phrase: PathPhrase;
  prompt: string;
  promptLabel: string;
  turns: { speaker: string; line: string }[];
  options: string[];
  answer: string;
};

type Question = ChoiceQuestion | AssembleQuestion | DialogueQuestion;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function tokensFor(text: string): string[] {
  return text
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Sitting shape for each skill family (existing phrase data only). */
function kindsForFamily(family: SkillFamily): QuestionKind[] {
  switch (family) {
    case "vocab":
    case "culture":
      return ["translate", "reverse", "translate"];
    case "grammar":
      return ["translate", "assemble", "reverse"];
    case "phrase":
      return ["assemble", "reverse", "translate"];
    case "dialogue":
      return ["dialogue", "assemble", "reverse"];
  }
}

function buildChoice(
  kind: "translate" | "reverse",
  phrase: PathPhrase,
  pool: PathPhrase[],
): ChoiceQuestion {
  if (kind === "translate") {
    const wrong = shuffle(
      pool.filter(
        (item) =>
          item.id !== phrase.id &&
          item.english.toLowerCase() !== phrase.english.toLowerCase(),
      ),
    )
      .slice(0, 3)
      .map((item) => item.english);
    return {
      kind,
      phrase,
      prompt: phrase.forro,
      promptLabel: "What does this mean?",
      answer: phrase.english,
      options: shuffle([...new Set([phrase.english, ...wrong.slice(0, 3)])]),
    };
  }

  const wrong = shuffle(
    pool.filter(
      (item) =>
        item.id !== phrase.id &&
        item.forro.toLowerCase() !== phrase.forro.toLowerCase(),
    ),
  )
    .slice(0, 3)
    .map((item) => item.forro);
  return {
    kind,
    phrase,
    prompt: phrase.english,
    promptLabel: "How do you say this in Forro?",
    answer: phrase.forro,
    options: shuffle([...new Set([phrase.forro, ...wrong.slice(0, 3)])]),
  };
}

function buildAssemble(
  phrase: PathPhrase,
  pool: PathPhrase[],
): AssembleQuestion {
  const answerTokens = tokensFor(phrase.forro);
  const decoys = shuffle(
    pool
      .filter((item) => item.id !== phrase.id)
      .flatMap((item) => tokensFor(item.forro)),
  )
    .filter(
      (token, index, all) =>
        !answerTokens.includes(token) && all.indexOf(token) === index,
    )
    .slice(0, Math.max(2, Math.min(4, answerTokens.length)));

  return {
    kind: "assemble",
    phrase,
    prompt: phrase.english,
    promptLabel: "Build the Forro sentence",
    answer: answerTokens.join(" "),
    bank: shuffle([...answerTokens, ...decoys]),
  };
}

function buildDialogue(
  phrase: PathPhrase,
  levelPhrases: PathPhrase[],
  pool: PathPhrase[],
): DialogueQuestion | null {
  const peers = [...levelPhrases].sort((a, b) => a.id.localeCompare(b.id));
  const index = peers.findIndex((item) => item.id === phrase.id);
  if (index <= 0) return null;
  const turns = peers.slice(0, index).map((item, offset) => ({
    speaker: offset % 2 === 0 ? "A" : "B",
    line: item.forro,
  }));
  if (turns.length === 0) return null;
  const wrong = shuffle(
    pool.filter(
      (item) =>
        item.id !== phrase.id &&
        item.forro.toLowerCase() !== phrase.forro.toLowerCase(),
    ),
  )
    .slice(0, 3)
    .map((item) => item.forro);
  if (wrong.length < 2) return null;
  return {
    kind: "dialogue",
    phrase,
    prompt: phrase.english,
    promptLabel: "Pick the next line in the talk",
    turns,
    answer: phrase.forro,
    options: shuffle([...new Set([phrase.forro, ...wrong.slice(0, 3)])]),
  };
}

function buildQuestions(
  phrases: PathPhrase[],
  distractors: PathPhrase[],
  skillFamily: SkillFamily,
): Question[] {
  const pool = distractors.length > 0 ? distractors : phrases;
  const kinds = kindsForFamily(skillFamily);
  const ordered = shuffle(phrases);
  const questions: Question[] = [];

  ordered.forEach((phrase, index) => {
    const kind = kinds[index % kinds.length];
    if (kind === "dialogue") {
      const dialogue = buildDialogue(phrase, phrases, pool);
      if (dialogue) {
        questions.push(dialogue);
        return;
      }
    }
    if (kind === "assemble" && tokensFor(phrase.forro).length >= 2) {
      questions.push(buildAssemble(phrase, pool));
      return;
    }
    const fallback =
      kind === "assemble" || kind === "dialogue" ? "translate" : kind;
    questions.push(buildChoice(fallback, phrase, pool));
  });

  return questions;
}

export function LessonQuiz({
  unitNumber,
  levelNumber,
  unitTitle,
  levelTitle,
  skillFamily = "phrase",
  phrases,
  distractors,
}: LessonQuizProps) {
  const progress = useLearnerProgress();
  // The parent mounts after hydration and keys each lesson, avoiding random
  // server/client markup differences and effect-driven state resets.
  const [baseQuestions] = useState(() => buildQuestions(phrases, distractors, skillFamily));
  const [queue, setQueue] = useState<Question[]>(baseQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [assembled, setAssembled] = useState<string[]>([]);
  const [usedBankIndexes, setUsedBankIndexes] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState<Question[]>([]);
  const [inReprise, setInReprise] = useState(false);
  const [done, setDone] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const result = useRef<LessonResult | null>(null);

  async function persist() {
    if (saving) return;
    setSaving(true);
    setSaveFailed(false);
    setSaveMessage("Saving your lesson…");
    result.current ??= { unit: unitNumber, level: levelNumber,
      score: Math.round(correctCount / baseQuestions.length * 100), completedAt: new Date().toISOString() };
    try { setSaveMessage(await progress.save(result.current)); }
    catch (error) { setSaveMessage(error instanceof Error ? error.message : "Could not save. Please try again."); setSaveFailed(true); }
    finally { setSaving(false); }
  }

  if (baseQuestions.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        This lesson has no phrases yet.
      </p>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Lesson complete
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
          {levelTitle}
        </h2>
        <p className="mt-3 text-base text-[var(--muted)]">
          First attempt: {correctCount} of {baseQuestions.length} correct.
          {inReprise ? " Review complete." : ""}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]" role="status">{saveMessage}</p>
        {saveFailed && <button type="button" disabled={saving} onClick={() => void persist()} className="mt-3 font-medium text-[var(--brand)] underline">Retry save</button>}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/home"
            aria-disabled={saving}
            className={`inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand)] px-6 text-sm font-semibold text-white hover:bg-[var(--brand-ink)] ${saving ? "pointer-events-none opacity-60" : ""}`}
          >
            Back to course map
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              result.current = null;
              setQueue(baseQuestions);
              setIndex(0);
              setSelected(null);
              setAssembled([]);
              setUsedBankIndexes([]);
              setRevealed(false);
              setCorrectCount(0);
              setMissed([]);
              setInReprise(false);
              setDone(false);
            }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--foreground)] hover:bg-[#eef3f0]"
          >
            Practice again
          </button>
        </div>
      </div>
    );
  }

  const question = queue[index];
  const progressTotal = queue.length;
  const canCheck =
    question.kind === "assemble"
      ? assembled.length > 0
      : selected !== null;
  const assembledAnswer = assembled.join(" ");
  const isCorrect =
    question.kind === "assemble"
      ? assembledAnswer === question.answer
      : selected === question.answer;

  function resetAnswer() {
    setSelected(null);
    setAssembled([]);
    setUsedBankIndexes([]);
    setRevealed(false);
  }

  function advance() {
    if (index + 1 < queue.length) {
      setIndex((value) => value + 1);
      resetAnswer();
      return;
    }

    if (!inReprise && missed.length > 0) {
      setQueue(missed);
      setIndex(0);
      resetAnswer();
      setInReprise(true);
      setMissed([]);
      return;
    }

    setDone(true);
    void persist();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#e6ebe8]">
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-[width]"
          style={{
            width: `${Math.round(((index + (revealed ? 1 : 0)) / progressTotal) * 100)}%`,
          }}
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {unitTitle}
        {inReprise ? " · Review" : ""}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
        {levelTitle}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Question {index + 1} of {progressTotal}
      </p>

      <div className="mt-8">
        <p className="text-sm font-medium text-[var(--muted)]">
          {question.promptLabel}
        </p>
        {question.kind === "dialogue" ? (
          <div className="mt-3 space-y-2 rounded-2xl bg-[var(--surface)] px-4 py-3">
            {question.turns.map((turn, turnIndex) => (
              <p
                key={`${turn.speaker}-${turnIndex}`}
                className="text-base font-medium text-[var(--foreground)]"
              >
                <span className="mr-2 font-semibold text-[var(--brand)]">
                  {turn.speaker}
                </span>
                {turn.line}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[clamp(1.75rem,5vw,2.25rem)] font-semibold tracking-tight text-[var(--foreground)]">
            {question.prompt}
          </p>
        )}
        {question.kind === "dialogue" && question.prompt ? (
          <p className="mt-3 text-sm text-[var(--muted)]">{question.prompt}</p>
        ) : null}
      </div>

      {question.kind === "assemble" ? (
        <div className="mt-8 space-y-4">
          <div className="min-h-14 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <p className="text-base font-medium text-[var(--foreground)]">
              {assembled.length > 0 ? assembled.join(" ") : "…"}
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {question.bank.map((token, tokenIndex) => {
              const used = usedBankIndexes.includes(tokenIndex);
              return (
                <li key={`${token}-${tokenIndex}`}>
                  <button
                    type="button"
                    disabled={revealed || used}
                    onClick={() => {
                      if (revealed || used) return;
                      setAssembled((current) => [...current, token]);
                      setUsedBankIndexes((current) => [...current, tokenIndex]);
                    }}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/35 disabled:cursor-default disabled:opacity-40 ${
                      used
                        ? "bg-[#eef3f0] text-[var(--muted)]"
                        : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[#eef3f0]"
                    }`}
                  >
                    {token}
                  </button>
                </li>
              );
            })}
          </ul>
          {!revealed && assembled.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setAssembled((current) => current.slice(0, -1));
                setUsedBankIndexes((current) => current.slice(0, -1));
              }}
              className="text-sm text-[var(--muted)] underline-offset-4 hover:underline"
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {question.options.map((option) => {
            let tone =
              "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[#eef3f0]";
            if (revealed) {
              if (option === question.answer) {
                tone = "bg-[#e8f6ee] text-[var(--brand-ink)]";
              } else if (option === selected) {
                tone = "bg-[#f7ecec] text-[#7a2e2e]";
              } else {
                tone = "bg-[var(--surface)] text-[var(--muted)] opacity-70";
              }
            } else if (selected === option) {
              tone = "bg-[#e8f6ee] text-[var(--brand-ink)]";
            }

            return (
              <li key={option}>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(option)}
                  className={`flex w-full items-center rounded-2xl px-4 py-3.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/35 disabled:cursor-default ${tone}`}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Link
          href="/home"
          className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
        >
          Exit
        </Link>
        <button
          type="button"
          disabled={!canCheck}
          onClick={() => {
            if (!canCheck) return;
            if (!revealed) {
              if (isCorrect && !inReprise) {
                setCorrectCount((count) => count + 1);
              } else if (!isCorrect && !inReprise) {
                setMissed((current) => [...current, question]);
              }
              setRevealed(true);
              return;
            }
            advance();
          }}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand)] px-6 text-sm font-semibold text-white hover:bg-[var(--brand-ink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {!revealed
            ? "Check"
            : index + 1 >= queue.length
              ? inReprise || missed.length === 0
                ? "Finish"
                : "Review misses"
              : "Next"}
        </button>
      </div>

      {revealed ? (
        <p
          className={`mt-4 text-sm font-medium ${
            isCorrect ? "text-[var(--brand)]" : "text-[#7a2e2e]"
          }`}
        >
          {isCorrect ? "Correct." : `Answer: ${question.answer}`}
        </p>
      ) : null}
    </div>
  );
}
