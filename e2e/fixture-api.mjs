// Loopback-only synthetic test API. Never loads credentials or production data.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const catalog = { entries: [
  { id: 'fixture-1', unit_number: 1, level_number: 1, forro_text: 'Fixture phrase one', translation_en: 'Translation one' },
  { id: 'fixture-2', unit_number: 1, level_number: 2, forro_text: 'Fixture phrase two', translation_en: 'Translation two' },
  { id: 'fixture-3', unit_number: 2, level_number: 1, forro_text: 'Fixture phrase three', translation_en: 'Translation three' },
].map(row => ({ ...row, kind: 'path', skill_family: 'vocab', unit_title: `Fixture unit ${row.unit_number}`, level_title: `Fixture lesson ${row.level_number}` })) };
let accounts = new Map(), sessions = new Map(), snapshots = new Map(), failWrites = false;
let platform, createWorker;
if (process.env.PLATFORM_TEST_ROOT) {
  ({ createWorker } = await import(pathToFileURL(`${process.env.PLATFORM_TEST_ROOT}/tests/helpers/worker.ts`).href));
  platform = createWorker();
}
function reply(body, status = 200) { return Response.json(body, { status }); }
function error(code, status) { return reply({ status: 'error', code }, status); }

async function handle(request) {
  const path = new URL(request.url).pathname;
  if (path === '/_test/reset') {
    if (platform) { await platform.drain(); platform.sqlite.close(); platform = createWorker(); }
    accounts = new Map(); sessions = new Map(); snapshots = new Map(); failWrites = false;
    return reply({ status: 'ok' });
  }
  if (path === '/_test/provision') {
    const body = await request.json();
    if (!body.email?.endsWith('@example.test')) return error('TEST_IDENTITY_REQUIRED', 400);
    if (platform) {
      const signup = await platform.request('/app/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ForroVivo-Service-Key': 'test-only-service-key' }, body: JSON.stringify(body) });
      const pending = await signup.json();
      const verified = await platform.request('/app/v1/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: pending.verificationToken, password: body.password }) });
      if (!verified.ok) return verified;
      return reply({ status: 'ok' });
    }
    const key = body.email.toLowerCase();
    if (!accounts.has(key)) accounts.set(key, { provider: 'email', email: key, displayName: body.displayName || 'Fixture learner', appLanguage: 'en', studyLanguage: 'forro', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), password: body.password });
    return reply({ status: 'ok' });
  }
  if (path === '/_test/fail-writes') { failWrites = (await request.json()).enabled === true; return reply({ status: 'ok' }); }
  if (path.includes('/catalog/forro/learning_path.json')) return reply(catalog);
  if (path.includes('/catalog/health')) return reply({ status: 'ok' });
  if (path === '/app/v1/progress' && request.method === 'PUT' && failWrites) return error('PROGRESS_PAUSED', 503);
  if (platform) {
    const response = await platform.request(new URL(request.url).pathname + new URL(request.url).search, {
      method: request.method, headers: request.headers,
      ...(request.method !== 'GET' && request.method !== 'HEAD' ? { body: await request.text() } : {}),
    });
    await platform.drain();
    return response;
  }
  if (path === '/health' || path.endsWith('/health')) return reply({ status: 'ok', d1: 'ok' });
  if (path === '/app/v1/auth/register') return reply({ status: 'ok', pending: true });
  if (path === '/app/v1/auth/login') {
    const body = await request.json();
    const key = body.email?.toLowerCase();
    const account = accounts.get(key);
    if (!account || account.password !== body.password) return error('AUTH_INVALID', 401);
    const token = `fv_learn_${randomBytes(24).toString('hex')}`;
    sessions.set(token, key);
    return reply({ status: 'ok', token, accountKey: `email:${key}`, provider: 'email', expiresAt: new Date(Date.now() + 3600_000).toISOString() });
  }
  const identity = sessions.get(request.headers.get('authorization')?.replace(/^Bearer /, ''));
  if (path === '/app/v1/session' && request.method === 'DELETE') {
    sessions.delete(request.headers.get('authorization')?.replace(/^Bearer /, ''));
    return reply({ status: 'ok', revoked: true });
  }
  if (!identity) return error('LEARNER_AUTH_INVALID', 401);
  const account = accounts.get(identity);
  if (path === '/app/v1/account') {
    if (request.method === 'DELETE') { accounts.delete(identity); for (const [token, key] of sessions) if (key === identity) sessions.delete(token); return reply({ status: 'ok', deleted: true }); }
    if (request.method === 'PUT') { const body = await request.json(); Object.assign(account, { displayName: body.displayName, appLanguage: body.appLanguage }); }
    const visible = { ...account };
    delete visible.password;
    return reply({ status: 'ok', account: visible });
  }
  if (path === '/app/v1/progress') {
    if (request.method === 'PUT') {
      const body = await request.json();
      const existing = snapshots.get(identity);
      const prior = existing?.payload && typeof existing.payload === 'object' ? existing.payload : {};
      const incoming = body.payload && typeof body.payload === 'object' ? body.payload : {};
      const baseline = new Map((body.basePayload?.unitProgress || []).map(row => [row.unitId, row]));
      const payload = { ...prior };
      for (const [key, value] of Object.entries(incoming)) if (key !== 'unitProgress') payload[key] = value;
      const rows = new Map((prior.unitProgress || []).map(row => [row.unitId, row]));
      for (const row of incoming.unitProgress || []) {
        const old = rows.get(row.unitId) || {};
        const read = baseline.get(row.unitId);
        const merged = { ...old, unitId: row.unitId };
        for (const [key, value] of Object.entries(row)) {
          if (read && Object.is(read[key], value) && Object.hasOwn(old, key)) continue;
          merged[key] = value;
        }
        merged.completedLessonCount = Math.max(old.completedLessonCount || 0, row.completedLessonCount || 0);
        merged.acknowledgedLessonCount = Math.max(old.acknowledgedLessonCount || 0, row.acknowledgedLessonCount || 0);
        merged.bestScorePercent = Math.max(old.bestScorePercent || 0, row.bestScorePercent || 0);
        merged.isUnlocked = Boolean(old.isUnlocked || row.isUnlocked);
        rows.set(row.unitId, merged);
      }
      if (incoming.unitProgress) payload.unitProgress = [...rows.values()];
      const { payload: _ignored, basePayload: _baseline, ...rest } = body;
      snapshots.set(identity, { ...existing, ...rest, payload });
      return reply({ status: 'ok', studyLanguage: 'forro', updatedAt: body.updatedAt });
    }
    if (new URL(request.url).searchParams.get('studyLanguage') !== 'forro') return error('PROGRESS_NOT_FOUND', 404);
    const saved = snapshots.get(identity);
    return saved ? reply({ status: 'ok', ...saved }) : error('PROGRESS_NOT_FOUND', 404);
  }
  return error('NOT_FOUND', 404);
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const response = await handle(new Request(`http://127.0.0.1:4319${incoming.url}`, { method: incoming.method, headers: incoming.headers,
      ...(body.length ? { body } : {}) }));
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.writeHead(500, { 'content-type': 'application/json' }); outgoing.end(JSON.stringify({ status: 'error', code: 'FIXTURE_FAILURE' })); }
});
server.listen(4319, '127.0.0.1');
process.on('SIGTERM', () => server.close());
