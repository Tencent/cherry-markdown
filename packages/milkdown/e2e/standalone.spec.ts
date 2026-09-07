import { test, expect, type Page } from '@playwright/test';
import { cherryCompatibilityCases } from '../test/fixtures/compatibility';
const runtimeErrors = new WeakMap<Page, string[]>();

async function markdown(page: Page) {
  return page.evaluate(() => window.milkdownEditor!.getMarkdown());
}
async function setMarkdown(page: Page, value: string) {
  await page.evaluate((value) => window.milkdownEditor!.setMarkdown(value), value);
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});
test.afterEach(async ({ page }, info) => {
  const errors = runtimeErrors.get(page) ?? [];
  await info.attach('runtime-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  const finalMarkdown = await page.evaluate(() => window.milkdownEditor?.getMarkdown()).catch(() => undefined);
  if (finalMarkdown) await info.attach('final-markdown', { body: finalMarkdown, contentType: 'text/markdown' });
  expect(errors).toEqual([]);
});

test('standalone boot has no source editor, top toolbar or runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.reload();
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
  await expect(page.locator('h1').filter({ hasText: 'Cherry Markdown' })).toBeVisible();
  await expect(page.locator('.cm-editor,.cherry-toolbar')).toHaveCount(0);
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const item of cherryCompatibilityCases) {
  test(`capability: ${item.id}`, async ({ page }) => {
    await setMarkdown(page, item.markdown);
    if (item.selector) await expect(page.locator('.ProseMirror').locator(item.selector).first()).toBeAttached();
    if (item.expectedText) await expect(page.locator('.ProseMirror')).toContainText(item.expectedText);
    expect(await markdown(page)).toBe(item.markdown);
    await setMarkdown(page, 'Replacement');
    await expect(page.locator('.ProseMirror')).toContainText('Replacement');
    expect(await markdown(page)).toBe('Replacement');
  });
}

test('real text selection, Bubble formatting, undo, and no layout shift', async ({ page }) => {
  await setMarkdown(page, 'Selected text');
  const paragraph = page.locator('.ProseMirror > p').first();
  const before = await paragraph.boundingBox();
  await paragraph.click();
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+End');
  const bubble = page.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();
  expect(await paragraph.boundingBox()).toEqual(before);
  await bubble.getByRole('button', { name: '粗体', exact: true }).click();
  await expect(paragraph.locator('strong')).toHaveText('Selected text');
  expect(await markdown(page)).toContain('**Selected text**');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph.locator('strong')).toHaveCount(0);
});

test('code typing is monotonic and cannot open text Bubble', async ({ page }) => {
  await setMarkdown(page, 'Use `x` here.');
  const code = page.locator('.ProseMirror p code');
  await code.click();
  await page.keyboard.press('ArrowRight');
  for (let index = 0; index < 50; index++) {
    await page.keyboard.type('a', { delay: 5 });
    expect(await markdown(page)).toContain(`x${'a'.repeat(index + 1)}`);
  }
  await setMarkdown(page, '```javascript\nconst value = 1;\n```');
  const block = page.locator('.ProseMirror pre code').first();
  await block.click();
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+End');
  // Chromium includes a layout newline when a range ends at a block <code>.
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trimEnd())).toBe('const value = 1;');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
  await page.keyboard.type('const updated = 2;');
  expect(await markdown(page)).toContain('const updated = 2;');
});

test('Mermaid renders and source editing stays open without text Bubble', async ({ page }) => {
  await setMarkdown(page, '```mermaid\ngraph LR\n A-->B\n```');
  await expect(page.locator('.cherry-embed__preview svg')).toBeVisible();
  await page.getByRole('button', { name: '在节点内编辑源码', exact: true }).click();
  const source = page.locator('.cherry-embed__source code');
  await expect(source).toBeVisible();
  await source.press('ControlOrMeta+a');
  await source.pressSequentially('graph LR\n A-->C');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
  expect(await markdown(page)).toContain('A-->C');
  await expect(page.getByRole('button', { name: '在节点内编辑源码', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
});

test('table chart owns its rendered resources and responds to API updates', async ({ page }) => {
  await setMarkdown(page, '| :line:{"title":"Trend"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |');
  await expect(page.locator('.cherry-echarts-wrapper svg')).toBeVisible();
  await setMarkdown(page, 'Removed');
  await expect(page.locator('.cherry-echarts-wrapper')).toHaveCount(0);
});

test('native heading computed styles match without copying styles', async ({ page }) => {
  await setMarkdown(page, '# Heading\n\n- [ ] Task');
  const result = await page.evaluate(() => {
    const editor = window.milkdownEditor!;
    const native = document.createElement('div');
    native.className = 'cherry cherry-markdown';
    native.innerHTML = editor.engine.makeHtml(editor.getMarkdown());
    document.body.append(native);
    const properties = ['color', 'fontSize', 'fontWeight', 'lineHeight'];
    const read = (element: Element) =>
      properties.map((key) =>
        getComputedStyle(element).getPropertyValue(key.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)),
      );
    const actual = read(document.querySelector('.ProseMirror h1')!);
    const expected = read(native.querySelector('h1')!);
    native.remove();
    return { actual, expected };
  });
  expect(result.actual).toEqual(result.expected);
});

test('destroy removes the owned editor and controls', async ({ page }) => {
  await page.evaluate(() => window.milkdownEditor!.destroy());
  await expect(page.locator('.ProseMirror,.cherry-milkdown-bubble,.cherry-milkdown')).toHaveCount(0);
});

test('columns use every grid column for content, never for editing chrome', async ({ page }) => {
  await setMarkdown(page, '::: cols\nLeft content\n::\nRight content\n:::');
  const columns = page.locator('.cherry-panel-cols > .cherry-panel--col');
  await expect(columns).toHaveCount(2);
  const left = await columns.nth(0).boundingBox();
  const right = await columns.nth(1).boundingBox();
  expect(left).not.toBeNull();
  expect(right).not.toBeNull();
  expect(Math.abs(left!.y - right!.y)).toBeLessThan(1);
  expect(right!.x).toBeGreaterThan(left!.x);
  expect(Math.abs(left!.width - right!.width)).toBeLessThan(1);
  await expect(columns.nth(0)).toContainText('Left content');
  await expect(columns.nth(1)).toContainText('Right content');
});
