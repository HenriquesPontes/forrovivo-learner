import { apiOrigin, learnOrigin } from "@/lib/auth";

export type Probe = {
  name: string;
  ok: boolean;
  status: number | null;
  error?: string;
};

export type LearningHealth = {
  ok: boolean;
  host: string;
  probes: { catalog: Probe; account: Probe };
  checkedAt: string;
};

async function probe(name: string, url: string): Promise<Probe> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json().catch(() => null);
    return { name, ok: res.ok && body?.status === "ok" && (name !== "account" || body.d1 === "ok"), status: res.status };
  } catch (error) {
    return {
      name,
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

/** Live Learning API probes used by the portal home and /api/health. */
export async function getLearningHealth(): Promise<LearningHealth> {
  const [catalog, account] = await Promise.all([
    probe("catalog", `${apiOrigin()}/app/v1/catalog/health`),
    probe("account", `${apiOrigin()}/app/v1/account/health`),
  ]);

  return {
    ok: catalog.ok && account.ok,
    host: new URL(learnOrigin()).hostname,
    probes: { catalog, account },
    checkedAt: new Date().toISOString(),
  };
}
