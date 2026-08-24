import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const repositoryRoot = process.cwd();
const localTsc = join(repositoryRoot, 'node_modules', '.bin', 'tsc');
const outputDirectory = mkdtempSync(join(tmpdir(), 'lcc-auth-member-'));

try {
  const compile = spawnSync(localTsc, [
    'scripts/authMemberDiagnostics.ts',
    '--outDir', outputDirectory,
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--target', 'es2022',
    '--esModuleInterop',
    '--resolveJsonModule',
    '--skipLibCheck',
    '--noEmit', 'false',
    '--noEmitOnError', 'false',
  ], { cwd: repositoryRoot, encoding: 'utf8' });

  if (compile.stdout) process.stdout.write(compile.stdout);
  if (compile.stderr) process.stderr.write(compile.stderr);
  if (compile.status !== 0) process.exit(compile.status ?? 1);

  const require = createRequire(import.meta.url);
  require(join(outputDirectory, 'scripts', 'authMemberDiagnostics.js'));
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
}
