"use client";

import { useAuthLanguage } from "@/components/AuthLanguage";
import { translateLearner } from "@/lib/learner-copy";

export function LearnerText({ text }: { text: string }) {
  const { locale } = useAuthLanguage();
  return translateLearner(text, locale);
}

export function useLearnerCopy() {
  const { locale } = useAuthLanguage();
  return { locale, tr: (text: string) => translateLearner(text, locale) };
}
