import { redirect } from "next/navigation";

/** Login lives at `/`. Keep `/login` as an alias for header/bookmarks. */
export default function LoginAliasPage() {
  redirect("/");
}
