import { LearnerText } from "@/components/LearnerText";
import Link from "next/link";
import { CartoonScene } from "@/components/CartoonScene";

export default function NotFound() {
  return <div className="learner-world learner-state-world"><main id="learner-main" className="learner-state-card">
    <CartoonScene scene="search" />
    <p className="learner-eyebrow"><LearnerText text={"A LITTLE OFF THE PATH"} /></p>
    <h1><LearnerText text={"Let’s find your way back."} /></h1>
    <p><LearnerText text={"This page or lesson isn’t available. Your course is just a step away."} /></p>
    <Link className="learner-primary" href="/home"><LearnerText text={"Back to learning "} /><span aria-hidden="true">→</span></Link>
  </main></div>;
}
