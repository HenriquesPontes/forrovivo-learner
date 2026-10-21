"use client";

import { useState } from "react";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { QUICK_ONBOARDING_COOKIE } from "@/lib/onboarding";

export function AllSetGate({ show, children }: { show: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(show);
  if (!open) return children;

  return <OnboardingFlow onDone={() => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${QUICK_ONBOARDING_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setOpen(false);
  }} />;
}
