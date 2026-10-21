"use client";

import { LearnerText } from "@/components/LearnerText";


import Link from "next/link";
import { CartoonScene } from "@/components/CartoonScene";
import { LogoutButton } from "@/components/LogoutButton";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="learner-world learner-state-world"><main id="learner-main" className="learner-state-card">
    <CartoonScene scene="search" />
    <h1 className="text-2xl font-semibold"><LearnerText text={"We could not load your account"} /></h1>
    <p className="mt-3 text-[var(--muted)]"><LearnerText text={"Your access could not be checked. Please try again shortly."} /></p>
    <button type="button" onClick={reset} className="mt-6 rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white"><LearnerText text={"Try again"} /></button>
    <div className="learner-state-links"><Link href="/home"><LearnerText text={"Back to learning"} /></Link><LogoutButton label="Log out of this browser" /></div>
  </main></div>;
}
