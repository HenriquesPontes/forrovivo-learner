import Image from "next/image";

/** Decorative artwork shared by lessons and supporting screens. */
export function CartoonScene({ scene = "welcome", compact = false }: { scene?: "welcome" | "celebrate" | "key" | "search"; compact?: boolean }) {
  const source = {
    welcome: "/images/onboarding/welcome.png",
    celebrate: "/images/onboarding/ready.png",
    key: "/images/learning-path/nodes/lesson-13.webp",
    search: "/images/learning-path/nodes/lesson-53.webp",
  }[scene];
  return <div className={`cartoon-scene ${compact ? "cartoon-scene-compact" : ""}`} aria-hidden="true">
    <span className="cartoon-scene-spark">✦</span>
    <Image src={source} alt="" width={160} height={160} />
    <span className="cartoon-scene-spark cartoon-scene-spark-small">✧</span>
  </div>;
}
