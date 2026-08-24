import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __cherryNewDemo: Record<string, any>;
  }
}

async function openDemo(page: Page, route: string) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('body')).toHaveAttribute('data-demo-ready', 'true');
  return errors;
}

test('Engine renders hooks and sanitized HTML without an editor DOM', async ({ page }) => {
  const errors = await openDemo(page, '/new-engine.html');
  await expect(page.locator('#html')).toContainText('<mark>custom hook</mark>');
  await expect(page.locator('#html')).not.toContainText('<script>');
  await expect(page.locator('.cm-editor')).toHaveCount(0);
  expect(await page.evaluate(() => typeof window.__cherryNewDemo.engine.makeHtml)).toBe('function');
  expect(errors).toEqual([]);
});

test('Preview owns Markdown, DOM refresh, images and destroy', async ({ page }) => {
  const errors = await openDemo(page, '/new-preview.html');
  await page.locator('#markdown').fill('# Changed\n\n![pixel](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==)');
  await expect(page.locator('#preview h1')).toHaveText('Changed');
  await expect(page.locator('#preview img')).toHaveCount(1);
  expect(await page.evaluate(() => window.__cherryNewDemo.preview.getMarkdown())).toContain('# Changed');
  await page.locator('#destroy').click();
  await expect(page.locator('#status')).toContainText('destroy 已调用');
  expect(errors).toEqual([]);
});

test('Stream converges from incomplete chunks to the final Engine HTML', async ({ page }) => {
  const errors = await openDemo(page, '/new-stream.html');
  await page.evaluate(() => window.__cherryNewDemo.stream.setMarkdown('# Partial\n\n**open'));
  await page.evaluate(() => window.__cherryNewDemo.stream.setMarkdown(window.__cherryNewDemo.markdown));
  const result = await page.evaluate(() => ({
    markdown: window.__cherryNewDemo.stream.getValue(),
    html: window.__cherryNewDemo.stream.getHtml(),
    toc: window.__cherryNewDemo.stream.getToc(),
  }));
  expect(result.markdown).toContain('const ready = true');
  expect(result.html).toContain('<strong>strong</strong>');
  expect(result.html).toContain('cherry-table');
  expect(result.toc.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Milkdown keeps Markdown through input, selection, undo/redo and rich blocks', async ({ page }) => {
  const errors = await openDemo(page, '/new-milkdown.html');
  const editor = page.locator('.ProseMirror');
  await expect(editor).toBeVisible();
  await editor.click();
  await editor.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  expect(await page.evaluate(() => !window.getSelection()?.isCollapsed)).toBe(true);
  await editor.dispatchEvent('compositionstart', { data: '' });
  await page.keyboard.insertText('中文输入');
  await editor.dispatchEvent('compositionupdate', { data: '中文输入' });
  await editor.dispatchEvent('compositionend', { data: '中文输入' });
  await page.keyboard.press('Control+Z');
  await page.keyboard.press('Control+Shift+Z');
  await expect.poll(() => page.evaluate(() => window.__cherryNewDemo.adapter.getMarkdown())).toContain('中文输入');
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', ' 粘贴内容');
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }));
  });
  await expect.poll(() => page.evaluate(() => window.__cherryNewDemo.adapter.getMarkdown())).toContain('粘贴内容');

  const markdown = [
    '# Matrix',
    '',
    '- one',
    '',
    '| A | B |',
    '| - | - |',
    '| 1 | 2 |',
    '',
    '```js',
    'const ok = true;',
    '```',
    '',
    '![pixel](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==)',
  ].join('\n');
  await page.evaluate((value) => window.__cherryNewDemo.adapter.setMarkdown(value), markdown);
  const roundTrip = await page.evaluate(() => window.__cherryNewDemo.adapter.getMarkdown());
  expect(roundTrip).toMatch(/[*-] one/);
  expect(roundTrip).toContain('| A | B |');
  expect(roundTrip).toContain('const ok = true;');
  expect(roundTrip).toContain('data:image/gif');

  await page.locator('#roundtrip').click();
  await expect(page.locator('#status')).toContainText(/round-trip 保留|unsupported/);
  const proprietaryStatus = await page.locator('#status').textContent();
  const proprietaryMarkdown = await page.evaluate(() => window.__cherryNewDemo.adapter.getMarkdown());
  if (proprietaryStatus?.includes('unsupported')) expect(proprietaryMarkdown).toBe(roundTrip);
  else expect(proprietaryMarkdown).toContain('::: panel');
  expect(errors).toEqual([]);
});
