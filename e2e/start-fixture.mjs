import { spawn } from 'node:child_process';
import { join } from 'node:path';

const root = process.env.PLATFORM_TEST_ROOT;
const args = root ? ['--experimental-transform-types', '--no-warnings', '--import', join(root, 'tests/resolve-typescript.mjs')] : [];
const child = spawn(process.execPath, [...args, 'e2e/fixture-api.mjs'], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
