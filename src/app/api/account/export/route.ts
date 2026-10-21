import { requireAccount } from "@/lib/session";
import { cloudProgress } from "@/lib/progress-server";
import { json, routeError, RequestError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { token, account, scope } = await requireAccount();
    if (new URL(request.url).searchParams.get("scope") !== scope) throw new RequestError(409, "Your account changed. Reload this page before exporting.");
    const namespaces = ["forro", "lungie", "angolar", "fa_dambo", "cabo_verde", "guine_bissau"];
    const snapshots = await Promise.all(namespaces.map(async language => [language, await cloudProgress(token, language)] as const));
    const response = json({ formatVersion: 1, exportedAt: new Date().toISOString(), account,
      progress: Object.fromEntries(snapshots.map(([language, saved]) => [language, saved ? { updatedAt: saved.updatedAt, payload: saved.payload } : null])) });
    response.headers.set("Content-Disposition", 'attachment; filename="forrovivo-learning-data.json"');
    return response;
  } catch (error) { return routeError(error); }
}
