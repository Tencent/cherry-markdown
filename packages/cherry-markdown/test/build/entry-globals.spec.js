import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const readProjectFile = (filePath) => readFileSync(resolve(projectRoot, filePath), 'utf-8');

describe('browser global entry split', () => {
  it('keeps ESM entries free of window.Cherry side effects', () => {
    const esmEntries = ['src/index.js', 'src/index.core.js', 'src/index.stream.js'];

    esmEntries.forEach((entry) => {
      expect(readProjectFile(entry), entry).not.toMatch(/window\.Cherry\s*=/);
    });
  });

  it('keeps explicit globals in browser-only entries', () => {
    const browserEntries = {
      'src/index.browser.js': {
        globalAssignment: /window\.Cherry\s*=\s*Cherry/,
        namedExports: /export \* from '\.\/index'/,
      },
      'src/index.core.browser.js': {
        globalAssignment: /window\.Cherry\s*=\s*Cherry/,
        namedExports: /export \{ MenuHookBase, SyntaxHookBase \}/,
      },
      'src/index.engine.browser.js': {
        globalAssignment: /window\.CherryEngine\s*=\s*CherryEngine/,
        namedExports: /export \* from '\.\/index\.engine'/,
      },
      'src/index.stream.browser.js': {
        globalAssignment: /window\.Cherry\s*=\s*CherryStream/,
        namedExports: /export \{ SyntaxHookBase \}/,
      },
    };

    Object.entries(browserEntries).forEach(([entry, { globalAssignment, namedExports }]) => {
      const source = readProjectFile(entry);
      expect(source, entry).toMatch(/export default/);
      expect(source, entry).toMatch(globalAssignment);
      expect(source, entry).toMatch(namedExports);
    });
  });
});
