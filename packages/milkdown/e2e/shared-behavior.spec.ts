import { test, expect, markdown, setMarkdown } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

test('link and code copy share Cherry fallback and report actual results', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => true });
  });
  await setMarkdown(page, '[link](https://example.com)\n\n```js\nconst value = 1;\n```');
  const saved = await markdown(page);
  const code = page.locator('.cherry-milkdown-code-block');
  const copy = code.getByRole('button', { name: '复制代码' });
  await copy.click();
  await expect(copy).toHaveText('已复制');
  await expect(copy).toHaveText('复制');
  await page
    .locator('.ProseMirror a')
    .first()
    .click({ position: { x: 8, y: 8 } });
  const linkCopy = page.getByRole('toolbar', { name: '链接' }).getByRole('button').first();
  await linkCopy.click();
  await expect(linkCopy).toHaveAccessibleName('已复制');
  await expect(linkCopy).toHaveAccessibleName('复制链接');
  await page.evaluate(() => Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false }));
  await linkCopy.click();
  await expect(linkCopy).toHaveAccessibleName('复制失败');
  await copy.click();
  await expect(copy).toHaveText('复制失败');
  expect(await markdown(page)).toBe(saved);
});

test('link editing rejects encoded schemes using the Cherry policy without changing the document', async ({ page }) => {
  await setMarkdown(page, '[link](https://example.com)');
  const saved = await markdown(page);
  await page
    .locator('.ProseMirror a')
    .first()
    .click({ position: { x: 8, y: 8 } });
  await page.getByRole('toolbar', { name: '链接' }).getByRole('button', { name: '编辑链接' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  for (const href of ['j&#97;vascript:alert(1)', 'java&#x73;cript:alert(1)', 'data:text/html,test']) {
    await dialog.getByLabel('链接地址').fill(href);
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog.locator('.cherry-milkdown-link-editor__error')).toHaveText('请输入有效的链接地址。');
    expect(await markdown(page)).toBe(saved);
  }
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  expect(await markdown(page)).toBe(saved);
});

test('typed and imported Cherry extensions share their grammar and retain undo', async ({ page }) => {
  for (const [source, type, text] of [
    ['!!red red!!', 'cherry_color', 'red'],
    ['!!!yellow background!!!', 'cherry_background_color', 'background'],
    ['!24 size!', 'cherry_font_size', 'size'],
    ['^^sub^^', 'cherry_subscript', 'sub'],
    ['^sup^', 'cherry_superscript', 'sup'],
    ['{汉|han}', 'cherry_ruby', '汉han'],
    ['/underline/', 'cherry_underline', 'underline'],
    ['==highlight==', 'cherry_highlight', 'highlight'],
  ]) {
    await setMarkdown(page, source);
    const mark = page.locator(`.ProseMirror [data-cherry-mark="${type}"]`);
    await expect(mark).toHaveText(text);
    await setMarkdown(page, '');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type(source);
    await expect(mark).toHaveText(text);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(mark).toHaveCount(0);
  }
});

test('Cherry code languages keep live highlighting, undo and existing controls', async ({ page }) => {
  const block = page.locator('.cherry-milkdown-code-block');
  for (const [language, source, type, text] of [
    ['typescript', 'const answer: number = 42;', 'builtin', 'number'],
    ['json', '{"answer":42}', 'property', '"answer"'],
    ['python', 'print("hello")', 'keyword', 'print'],
  ]) {
    await setMarkdown(page, `\`\`\`${language}\n${source}\n\`\`\``);
    await expect(block.locator(`.token.${type}`).filter({ hasText: text })).toHaveCount(1);
  }
  const original = await markdown(page);
  const content = block.locator('code');
  await content.click();
  await page.keyboard.press('End');
  await page.keyboard.type('\nreturn True');
  await expect(block.locator('.token.keyword').filter({ hasText: 'return' })).toHaveCount(1);
  expect(await markdown(page)).toContain('return True');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(original);
  const node = await block.elementHandle();
  await page.evaluate(() => window.milkdownEditor!.setTheme('dark'));
  expect(await node!.evaluate((element) => element.isConnected)).toBe(true);
  expect(await markdown(page)).toBe(original);
  await expect(block.getByRole('button', { name: '复制代码' })).toBeVisible();
  await block.getByRole('combobox', { name: '代码语言' }).selectOption('javascript');
  await expect(block.locator('.token.function').filter({ hasText: 'print' })).toHaveCount(1);
  expect(await content.textContent()).toBe('print("hello")');
});
