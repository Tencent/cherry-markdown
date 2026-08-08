import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';

const packageRoot = path.resolve(__dirname, '../..');
const testCliRoot = path.resolve(path.dirname(require.resolve('@vscode/test-cli')), '..');

async function main(): Promise<void> {
  let executable = await downloadAndUnzipVSCode('1.131.0');

  // @vscode/test-electron 2.5.2 still resolves the historical macOS executable name.
  if (process.platform === 'darwin' && !fs.existsSync(executable)) {
    const codeExecutable = path.join(path.dirname(executable), 'Code');
    if (fs.existsSync(codeExecutable)) executable = codeExecutable;
  }

  if (!fs.existsSync(executable)) throw new Error(`VS Code test executable is missing: ${executable}`);

  const result = spawnSync(process.execPath, [path.join(testCliRoot, 'out', 'bin.mjs')], {
    cwd: packageRoot,
    env: { ...process.env, CHERRY_VSCODE_TEST_EXECUTABLE: executable },
    stdio: 'inherit',
  });

  process.exit(result.status ?? 1);
}

void main();
