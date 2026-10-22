import { redirect } from "next/navigation";

/** Retired password flow: use the same social account as the apps. */
export default function RetiredPasswordPage() {
  redirect("/");
}
