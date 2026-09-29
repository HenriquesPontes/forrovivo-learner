"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PathPhrase } from "@/lib/learning-path";

type LessonQuizProps = {
  unitTitle: string;
  levelTitle: string;
  phrases: PathPhrase[];
  distractors: PathPhrase[];
};

type Question = {
  phrase: PathPhrase;
  options: string[];
  answer: string;
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function buildQuestions(
  phrases: PathPhrase[],
  distractors: PathPhrase[],
): Question[] {
  const pool = distractors.length > 0 ? distractors : phrases;
  return shuffle(phrases).map((phrase) => {
    const wrong = shuffle(
      pool.filter(
        (item) =>
          item.id !== phrase.id &&
          item.english.toLowerCase() !== phrase.english.toLowerCase(),
      ),
    )
      .slice(0, 3)
      .map((item) => item.english);

    while (wrong.length < 3) {
      wrong.push(`Option ${wrong.length + 1}`);
    }

    return {
      phrase,
      answer: phrase.english,
      options: shuffle([phrase.english, ...wrong.slice(0, 3)]),
    };
  });
}

export function LessonQuiz({
  unitTitle,
  levelTitle,
  phrases,
  distractors,
}: LessonQuizProps) {
  const questions = useMemo(
    () => buildQuestions(phrases, distractors),
    [phrases, distractors],
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
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
          You got {correctCount} of {questions.length} correct.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/home"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand)] px-6 text-sm font-semibold text-white hover:bg-[var(--brand-ink)]"
          >
            Back to course map
          </Link>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setSelected(null);
              setRevealed(false);
              setCorrectCount(0);
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

  const question = questions[index];
  const isCorrect = selected === question.answer;

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {unitTitle}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
        {levelTitle}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Question {index + 1} of {questions.length}
      </p>

      <div className="mt-8">
        <p className="text-sm font-medium text-[var(--muted)]">
          What does this mean?
        </p>
        <p className="mt-3 text-[clamp(1.75rem,5vw,2.25rem)] font-semibold tracking-tight text-[var(--foreground)]">
          {question.phrase.forro}
        </p>
      </div>

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

      <div className="mt-8 flex items-center justify-between gap-3">
        <Link
          href="/home"
          className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
        >
          Exit
        </Link>
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            if (!revealed) {
              if (selected === question.answer) {
                setCorrectCount((count) => count + 1);
              }
              setRevealed(true);
              return;
            }
            if (index + 1 >= questions.length) {
              setDone(true);
              return;
            }
            setIndex((value) => value + 1);
            setSelected(null);
            setRevealed(false);
          }}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand)] px-6 text-sm font-semibold text-white hover:bg-[var(--brand-ink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {!revealed
            ? "Check"
            : index + 1 >= questions.length
              ? "Finish"
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
