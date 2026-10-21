import { redirect } from "next/navigation";
import { readLearnerAccess } from "@/lib/session";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountSettings } from "@/components/AccountSettings";

export default async function AccountPage() {
  const access = await readLearnerAccess();
  if (access.kind !== "account") redirect("/");
  return <div className="flex flex-1 flex-col"><SiteHeader signedIn />
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold text-[var(--brand-ink)]">Your account</h1>
      <AccountSettings account={access.account} scope={access.scope} />
    </main><SiteFooter /></div>;
}
