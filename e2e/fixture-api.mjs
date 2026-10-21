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
  if (path === '/app/v1/auth/login' || path === '/app/v1/auth/register') {
    const body = await request.json();
    const key = body.email?.toLowerCase();
    if (path.endsWith('/register')) {
      if (accounts.has(key)) return reply({ status: 'ok', pending: true });
      accounts.set(key, { provider: 'email', email: key, displayName: body.displayName || 'Fixture learner', appLanguage: 'en', studyLanguage: 'forro', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), password: body.password });
    }
    const account = accounts.get(key);
    if (!account || account.password !== body.password) return error('AUTH_INVALID', 401);
    const token = `fv_learn_${randomBytes(24).toString('hex')}`;
    sessions.set(token, key);
    return reply({ status: 'ok', token, accountKey: `email:${key}`, provider: 'email', expiresAt: new Date(Date.now() + 3600_000).toISOString() });
  }
  const identity = sessions.get(request.headers.get('authorization')?.replace(/^Bearer /, ''));
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
      const rows = new Map((existing?.payload.unitProgress || []).map(row => [row.unitId, row]));
      for (const row of body.payload.unitProgress) rows.set(row.unitId, { ...row, completedLessonCount: Math.max(rows.get(row.unitId)?.completedLessonCount || 0, row.completedLessonCount) });
      snapshots.set(identity, { ...body, payload: { ...body.payload, unitProgress: [...rows.values()] } });
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
