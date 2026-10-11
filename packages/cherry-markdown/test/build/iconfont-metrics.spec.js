// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFont, woff2 } from 'fonteditor-core';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('generated iconfont metrics', () => {
  it('writes consistent hhea and OS/2 baseline and line metrics', async () => {
    execFileSync(process.execPath, [resolve(projectRoot, 'build/run-iconfont.js')]);
    await woff2.init();
    for (const type of ['ttf', 'woff', 'woff2', 'eot']) {
      const font = createFont(readFileSync(resolve(projectRoot, `dist/fonts/ch-icon.${type}`)), { type }).get();
      const metrics = font['OS/2'];
      expect(metrics.sTypoAscender, type).toBe(font.hhea.ascent);
      expect(metrics.sTypoDescender, type).toBe(font.hhea.descent);
      expect(metrics.sTypoLineGap, type).toBe(font.hhea.lineGap);
      expect(metrics.usWinAscent, type).toBe(font.hhea.ascent);
      expect(metrics.usWinDescent, type).toBe(Math.abs(font.hhea.descent));
    }
  }, 15000);
});
