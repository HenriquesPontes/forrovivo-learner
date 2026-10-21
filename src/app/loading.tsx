import { LearnerText } from "@/components/LearnerText";
import { CartoonScene } from "@/components/CartoonScene";

export default function Loading() {
  return <div className="learner-world learner-state-world"><main id="learner-main" className="learner-state-card" aria-busy="true">
    <CartoonScene compact />
    <h1><LearnerText text={"Getting things ready…"} /></h1>
    <p role="status"><LearnerText text={"Loading your learning space."} /></p>
    <div className="cartoon-loading-track" aria-hidden="true"><span /></div>
  </main></div>;
}
