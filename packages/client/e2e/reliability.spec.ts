import { test as base, expect } from '@playwright/test';
import type {} from './runtime';

const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
      });
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/');
  await page.waitForFunction(() => Boolean(window.clientEditor));
});

test('real typing back to an earlier external value still marks the document changed', async ({ page }) => {
  await page.evaluate(async () => {
    await window.clientEditor.switch('milkdown');
    window.clientEditor.setMarkdown('A');
    window.clientEditor.setMarkdown('B');
  });
  const before = await page.evaluate(() => window.clientEditor.changes());
  const editor = page.locator('#milkdown-editor .ProseMirror');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('A');
  await expect.poll(() => page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('A');
  await expect.poll(() => page.evaluate(() => window.clientEditor.changes())).toBeGreaterThan(before);
});

test('applying a historical version can be undone and redone', async ({ page }) => {
  await page.evaluate(async () => {
    await window.clientEditor.switch('milkdown');
    window.clientEditor.setMarkdown('Current');
    window.clientEditor.clearUndoRedo();
    window.clientEditor.setMarkdown('Earlier version', { addToHistory: true });
  });
  const editor = page.locator('#milkdown-editor .ProseMirror');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('Current');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('Earlier version');
});

test('Chromium composition survives a same-value external write', async ({ page, context }) => {
  await page.evaluate(async () => {
    await window.clientEditor.switch('milkdown');
    window.clientEditor.setMarkdown('');
  });
  await page.locator('#milkdown-editor .ProseMirror').click();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.imeSetComposition', { text: '中文', selectionStart: 2, selectionEnd: 2 });
  await page.evaluate(() => window.clientEditor.setMarkdown(window.clientEditor.getMarkdown()));
  await cdp.send('Input.insertText', { text: '中文' });
  await expect.poll(() => page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('中文');
  await cdp.detach();
});

test('opening another file isolates undo/redo while edits in the new file remain undoable', async ({ page }) => {
  await page.evaluate(async () => {
    await window.clientEditor.switch('milkdown');
    window.clientEditor.setMarkdown('File A');
    window.clientEditor.clearUndoRedo();
  });
  const editor = page.locator('#milkdown-editor .ProseMirror');
  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await page.keyboard.press('ControlOrMeta+z');
  await page.evaluate(() => {
    window.clientEditor.setMarkdown('File B');
    window.clientEditor.clearUndoRedo();
  });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+z');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  expect(await page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('File B');
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('File B');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  expect(await page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('File B edited');
});

test('the first Cherry edit after a same-value write is reported during engine switching', async ({ page }) => {
  await page.evaluate(() => {
    window.clientEditor.setMarkdown('A');
    window.clientEditor.setMarkdown('A');
  });
  const before = await page.evaluate(() => window.clientEditor.changes());
  await page.locator('#markdown-editor .cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('B');
  await expect.poll(() => page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('B');
  await expect.poll(() => page.evaluate(() => window.clientEditor.changes())).toBeGreaterThan(before);
});

test('table and math initialization stay clean while subsequent typing is reported', async ({ page }) => {
  await page.evaluate(async () => {
    await window.clientEditor.switch('milkdown');
    window.clientEditor.setMarkdown('Start\n\n| Header |\n| --- |\n| Cell |\n\n$$\nx^2\n$$');
    window.clientEditor.clearUndoRedo();
  });
  const cell = page.locator('#milkdown-editor td p');
  await expect(cell).toHaveText('Cell');
  await expect(page.locator('#milkdown-editor .katex').first()).toBeVisible();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => window.clientEditor.changes())).toBe(0);
  const paragraph = page.locator('#milkdown-editor .ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect(paragraph).toHaveText('Start!');
  await expect.poll(() => page.evaluate(() => window.clientEditor.changes())).toBeGreaterThan(0);
});

test('rapid real engine switches keep the latest file and only one editor mounted', async ({ page }) => {
  await page.evaluate(async () => {
    const api = window.clientEditor;
    const first = api.switch('milkdown');
    api.setMarkdown('Old pending file');
    const second = api.switch('cherry');
    const third = api.switch('milkdown');
    api.setMarkdown('Latest file');
    api.clearUndoRedo();
    await Promise.all([first, second, third]);
  });
  await expect(page.locator('#milkdown-editor .ProseMirror')).toHaveCount(1);
  await expect(page.locator('#markdown-editor .cherry')).toHaveCount(0);
  await expect(page.locator('body')).toHaveClass(/engine-milkdown/);
  expect(await page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('Latest file');
  await expect.poll(() => page.evaluate(() => window.clientEditor.changes())).toBe(0);
  await page.locator('#milkdown-editor .ProseMirror').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('Latest file!');
  await page.evaluate(() => window.clientEditor.switch('cherry'));
  await expect(page.locator('#milkdown-editor .ProseMirror')).toHaveCount(0);
  await expect(page.locator('#markdown-editor .cm-editor')).toHaveCount(1);
  expect(await page.evaluate(() => window.clientEditor.getMarkdown().trim())).toBe('Latest file!');
});

test('disposing while mounting leaves no live editor or stale notification', async ({ page }) => {
  await page.evaluate(async () => {
    const mounting = window.clientEditor.switch('milkdown');
    await Promise.resolve();
    const disposal = window.clientEditor.dispose();
    await Promise.all([mounting, disposal]);
  });
  await expect(page.locator('.ProseMirror, .cm-editor')).toHaveCount(0);
  expect(await page.evaluate(() => window.clientEditor.changes())).toBe(0);
});
