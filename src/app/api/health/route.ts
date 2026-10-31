import { NextResponse } from "next/server";
import { getLearningHealth } from "@/lib/health";
import { PRIVATE_NO_STORE } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Live Learning API probes for the learner portal status strip. */
export async function GET() {
  const health = await getLearningHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503, headers: { "Cache-Control": PRIVATE_NO_STORE } });
}
