// HTTPS test host for the production Next build. No production TLS key is used.
import { createServer } from 'node:https';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'production';
const directory = mkdtempSync(join(tmpdir(), 'fv-learner-tls-'));
const key = join(directory, 'key.pem'), cert = join(directory, 'cert.pem'), config = join(directory, 'openssl.cnf');
writeFileSync(config, '[req]\ndistinguished_name=dn\nx509_extensions=v3\nprompt=no\n[dn]\nCN=localhost\n[v3]\nsubjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=critical,CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n');
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-config', config], { stdio: 'ignore' });
const next = (await import('next')).default;
const app = next({ dev: false, hostname: 'localhost', port: 4318 });
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (request, response) => {
  request.headers['x-forwarded-proto'] = 'https';
  void handle(request, response);
});
server.listen(4318, 'localhost');
async function stop() {
  server.close();
  server.closeAllConnections();
  await app.close();
  rmSync(directory, { recursive: true, force: true });
  process.exit(0);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { void stop(); });
process.on('exit', () => rmSync(directory, { recursive: true, force: true }));
