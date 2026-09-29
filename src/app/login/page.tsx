import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSessionToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to ForroVivo Learner with email and password.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage() {
  const token = await readSessionToken();
  if (token) redirect("/home");
  redirect("/");
}
