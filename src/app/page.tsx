import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { readLearnerAccess } from "@/lib/session";

export default async function Home() {
  const access = await readLearnerAccess();
  if (access.kind === "account") redirect("/home");

  return <AuthShell mode="login" />;
}
