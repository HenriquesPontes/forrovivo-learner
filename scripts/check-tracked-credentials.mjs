// Basic high-confidence guard over tracked source; complements GitHub secret scanning.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk_live_[A-Za-z0-9]{20,}\b/,
  /\bre_[A-Za-z0-9]{24,}\b/,
];
const findings = [];
for (const path of paths) {
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) continue;
  const base = path.split('/').at(-1);
  if ((/^\.env(?:\..*)?$/.test(base) && !/\.(example|sample|template)$/.test(base)) || /^(?:Secrets\.plist|\.dev\.vars)$/.test(base)) {
    findings.push({ file: path, reason: 'Private configuration is tracked' });
    continue;
  }
  const bytes = readFileSync(path);
  if (bytes.includes(0)) continue;
  if (patterns.some(pattern => pattern.test(bytes.toString('utf8')))) findings.push({ file: path, reason: 'Possible credential or private key' });
}
// Report filenames only. Never echo matched secret material.
console.log(JSON.stringify({ ok: findings.length === 0, findings,
  coverage: 'Tracked files and selected credential formats only; not a complete secret audit or history scan' }, null, 2));
if (findings.length) process.exitCode = 1;
