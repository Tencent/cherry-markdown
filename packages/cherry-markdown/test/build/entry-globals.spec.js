import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const readProjectFile = (filePath) => readFileSync(resolve(projectRoot, filePath), 'utf-8');

describe('UMD and ESM entry split', () => {
  it('keeps ESM entries free of window.Cherry side effects', () => {
    const esmEntries = [
      'src/index.js',
      'src/index.core.js',
      'src/index.engine.js',
      'src/index.engine.core.js',
      'src/index.stream.js',
    ];

    esmEntries.forEach((entry) => {
      expect(readProjectFile(entry), entry).not.toMatch(/window\.Cherry\s*=/);
    });
  });

  it('keeps explicit globals in UMD-only entries', () => {
    const umdEntries = {
      'src/index.umd.js': {
        globalAssignment: /window\.Cherry\s*=\s*Cherry/,
        namedExports: /export \* from '\.\/index'/,
      },
      'src/index.core.umd.js': {
        globalAssignment: /window\.Cherry\s*=\s*Cherry/,
        namedExports: /export \{ SyntaxHookBase, MenuHookBase \}/,
      },
      'src/index.stream.umd.js': {
        globalAssignment: /window\.Cherry\s*=\s*CherryStream/,
        namedExports: /export \{ SyntaxHookBase \}/,
      },
    };

    Object.entries(umdEntries).forEach(([entry, { globalAssignment, namedExports }]) => {
      const source = readProjectFile(entry);
      expect(source, entry).toMatch(/export default/);
      expect(source, entry).toMatch(globalAssignment);
      expect(source, entry).toMatch(namedExports);
    });
  });
});
