import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('loads the generated Prism runtime without browser or Node globals', () => {
  const result = execFileSync(
    process.execPath,
    [
      '--experimental-vm-modules',
      resolve('scripts/verify-prism-runtime.mjs'),
      resolve('src/generated/cherry-prism.js'),
    ],
    { encoding: 'utf8', timeout: 10_000 },
  );
  expect(result).toContain('Verified standalone Prism languages');
});
