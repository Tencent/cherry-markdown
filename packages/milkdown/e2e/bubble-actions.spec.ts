import type { Page } from '@playwright/test';
import { expect, markdown, setMarkdown, test } from './fixtures';

async function selectParagraph(page: Page) {
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click({ position: { x: 16, y: 8 } });
  const text = (await paragraph.textContent()) ?? '';
  const caretAtStart = () =>
    paragraph.evaluate((element) => {
      const selection = document.getSelection();
      if (!selection) return false;
      const root = element.getRootNode();
      const range =
        root instanceof ShadowRoot ? selection.getComposedRanges?.({ shadowRoots: [root] })[0] : undefined;
      if (!(range?.collapsed ?? selection.isCollapsed)) return false;
      const node = range?.startContainer ?? selection.anchorNode;
      const offset = range?.startOffset ?? selection.anchorOffset;
      if (!node || !element.contains(node)) return false;
      const before = document.createRange();
      before.selectNodeContents(element);
      before.setEnd(node, offset);
      return before.toString() === '';
    });
  // Observe native movement: sending extra arrows at the boundary can race
  // Chrome's pending selectionchange and does not prove where Shift starts.
  for (let index = 0; index < text.length + 2; index += 1) {
    if (await caretAtStart()) break;
    await page.keyboard.press('ArrowLeft');
  }
  await expect.poll(caretAtStart).toBe(true);
  for (let index = 0; index < text.length + 2; index += 1) {
    await page.keyboard.press('Shift+ArrowRight');
    if ((await page.evaluate(() => document.getSelection()?.toString())) === text) break;
  }
  await expect.poll(() => page.evaluate(() => document.getSelection()?.toString())).toBe(text);
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeVisible();
  return paragraph;
}

test.use({ actionTimeout: 8_000 });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

test('inline code formats only the selected paragraph and supports undo and redo', async ({ page }) => {
  const value = 'Selected text\n\nOutside';
  await setMarkdown(page, value);
  const paragraph = await selectParagraph(page);
  const box = await paragraph.boundingBox();
  await page.getByRole('button', { name: '行内代码', exact: true }).click();
  await expect(paragraph.locator('code')).toHaveText('Selected text');
  expect(await markdown(page)).toContain('`Selected text`');
  await expect(page.locator('.ProseMirror > p').nth(1)).toHaveText('Outside');
  expect((await paragraph.boundingBox())!.y).toBe(box!.y);
  await page.keyboard.press('ControlOrMeta+z');
  expect(await markdown(page)).toBe(value);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(paragraph.locator('code')).toHaveText('Selected text');
});

test('the link action preserves selected text and existing formatting and is undoable', async ({ page }) => {
  const value = '**Selected** text\n\nOutside';
  await setMarkdown(page, value);
  const paragraph = await selectParagraph(page);
  await page.getByRole('toolbar', { name: '文本格式' }).getByRole('button', { name: '链接', exact: true }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await expect(form).toBeVisible();
  await expect(form.getByLabel('链接显示文本')).toHaveValue('Selected text');
  await form.getByLabel('链接地址').fill('https://example.com');
  await form.getByRole('button', { name: '保存', exact: true }).click();
  await expect(paragraph.locator('a')).toHaveText(['Selected', ' text']);
  await expect(paragraph.locator('strong')).toHaveText('Selected');
  for (const anchor of await paragraph.locator('a').all()) {
    await expect(anchor).toHaveAttribute('href', 'https://example.com');
  }
  await page.keyboard.press('ControlOrMeta+z');
  expect(await markdown(page)).toBe(value);
});

test('more exposes highlight, preserves selection and supports single-step undo', async ({ page }) => {
  const value = 'Selected text\n\nOutside';
  await setMarkdown(page, value);
  const paragraph = await selectParagraph(page);
  const toolbar = page.getByRole('toolbar', { name: '文本格式' });
  await expect(toolbar.getByRole('button', { name: '高亮', exact: true })).toBeHidden();
  await toolbar.getByRole('button', { name: '更多', exact: true }).click();
  await expect(toolbar.getByRole('button', { name: '更多', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await toolbar.getByRole('button', { name: '高亮', exact: true }).click();
  await expect(paragraph.locator('mark')).toHaveText('Selected text');
  expect(await markdown(page)).toContain('==Selected text==');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await markdown(page)).toBe(value);
});

test('clear formatting keeps links, targets and other paragraphs with one undo', async ({ page }) => {
  const value = '[**Selected** text](https://example.com){target=_blank}\n\n**Outside**';
  await setMarkdown(page, value);
  const paragraph = await selectParagraph(page);
  const toolbar = page.getByRole('toolbar', { name: '文本格式' });
  await toolbar.getByRole('button', { name: '更多', exact: true }).click();
  await toolbar.getByRole('button', { name: '清除格式', exact: true }).click();
  await expect(paragraph.locator('strong')).toHaveCount(0);
  await expect(paragraph.locator('a')).toHaveAttribute('href', 'https://example.com');
  expect(await markdown(page)).toContain('{target=_blank}');
  await expect(page.locator('.ProseMirror > p').nth(1).locator('strong')).toHaveText('Outside');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph.locator('strong')).toHaveText('Selected');
  await expect(paragraph).toHaveText('Selected text');
  for (const anchor of await paragraph.locator('a').all()) {
    await expect(anchor).toHaveAttribute('href', 'https://example.com');
  }
  expect(await markdown(page)).toContain('{target=_blank}');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(paragraph.locator('strong')).toHaveCount(0);
});

test('more supports keyboard dismissal and closes after clicking outside', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await setMarkdown(page, 'Selected text\n\nOutside');
  await selectParagraph(page);
  const toolbar = page.getByRole('toolbar', { name: '文本格式' });
  const more = toolbar.getByRole('button', { name: '更多', exact: true });
  await more.focus();
  await more.press('Enter');
  await expect(toolbar.getByRole('button', { name: '高亮', exact: true })).toBeFocused();
  await expect
    .poll(async () => {
      const rect = await toolbar.boundingBox();
      return Boolean(rect && rect.x >= 8 && rect.x + rect.width <= 352 && rect.y >= 0 && rect.y + rect.height <= 640);
    })
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.press('Enter');
  await page.mouse.click(350, 560);
  await expect(toolbar).toBeHidden();
  expect(await markdown(page)).toBe('Selected text\n\nOutside');
});
