import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { readLearnerAccess } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a ForroVivo Learner account with email, Apple or Google.",
  alternates: { canonical: "/create-account" },
};

export default async function CreateAccountPage() {
  const access = await readLearnerAccess();
  if (access.kind === "account") redirect("/home");

  return <AuthShell mode="register" guest={access.kind === "guest"} />;
}
