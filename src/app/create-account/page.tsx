import { redirect } from "next/navigation";

/** Accounts are created by the first Apple or Google sign-in. There is no separate registration screen. */
export default function CreateAccountPage() {
  redirect("/");
}
