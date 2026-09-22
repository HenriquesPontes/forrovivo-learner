import { ACCOUNT_HEALTH_URL, CATALOG_HEALTH_URL } from "@/lib/constants";

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
    return { name, ok: res.ok, status: res.status };
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
    probe("catalog", CATALOG_HEALTH_URL),
    probe("account", ACCOUNT_HEALTH_URL),
  ]);

  return {
    ok: catalog.ok && account.ok,
    host: "learn.forrovivo.com",
    probes: { catalog, account },
    checkedAt: new Date().toISOString(),
  };
}
