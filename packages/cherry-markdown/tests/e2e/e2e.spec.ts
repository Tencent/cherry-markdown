import { expect, describe, beforeAll, afterAll, it, vi, beforeEach, afterEach } from 'vitest';
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const examplesDir = path.resolve(__dirname, '../../../../examples');
const htmlFiles = fs.readdirSync(examplesDir).filter((file) => file.endsWith('.html'));

describe('E2E', () => {
  let browser;
  beforeAll(async () => {
    spawnSync('yarn', ['run', 'build:debug'], {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
      shell: true,
    });
    spawnSync('yarn', ['run', 'iconfont'], {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
      shell: true,
    });
    console.log(`beforeAll`);
  });
  describe('examples', () => {
    beforeEach(async () => {
      browser = await chromium.launch({
        headless: true, // 设置为 false 可以看到浏览器界面
      });
    });
    afterEach(async () => {
      await browser.close();
    });

    htmlFiles.forEach((file) => {
      it(file, async () => {
        const page = await browser.newPage();
        await page.goto(`file://${path.join(examplesDir, file)}`);
        await page.waitForLoadState('networkidle');
        const element = await page.$('body');
        const body = await element?.innerHTML();
        expect(body).toMatchSnapshot();
      });
    });
  });
});
