import { test, expect, markdown, setMarkdown } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>',
    }),
  );
});

test('Cherry syntax typed in inline code stays literal and undoable', async ({ page }) => {
  await setMarkdown(page, '`!!red literal!`');
  await page.locator('.ProseMirror code').click();
  await page.locator('.ProseMirror code').evaluate((element) => {
    element.ownerDocument.getSelection()?.collapse(element.firstChild, element.textContent?.length ?? 0);
    element.ownerDocument.dispatchEvent(new Event('selectionchange'));
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.keyboard.type('!');
  await expect(page.locator('.ProseMirror code')).toHaveText('!!red literal!!');
  await expect(page.locator('[data-cherry-mark="cherry_color"]')).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.ProseMirror code')).toHaveText('!!red literal!');
});

test('image URLs, titles and Cherry decoration survive import and source editing', async ({ page }) => {
  const value = `![photo#border](<https://example.com/a)b.png> 'A "quote"')`;
  await setMarkdown(page, value);
  const image = page.locator('.ProseMirror img[src]');
  await expect(image).toHaveAttribute('src', 'https://example.com/a%29b.png');
  await expect(image).toHaveAttribute('title', 'A "quote"');
  await expect(image).toHaveClass(/cherry-img-deco-border/);
  expect(await markdown(page)).toBe(value);
  await image.click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const form = page.locator('.cherry-milkdown-image-source');
  await form.locator('input[name="source"]').fill('https://example.com/new)image.png');
  await form.getByRole('button', { name: '保存', exact: true }).click();
  await expect(image).toHaveAttribute('src', 'https://example.com/new%29image.png');
  await expect(image).toHaveClass(/cherry-img-deco-border/);
});

test('editing and unlinking a formatted link always affect the whole link', async ({ page }) => {
  await setMarkdown(page, '[one **two** three](https://example.com){target=_blank}');
  await page
    .locator('.ProseMirror a')
    .last()
    .click({ position: { x: 8, y: 8 } });
  await expect(page.getByRole('toolbar', { name: '链接', exact: true })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await expect(form.getByRole('textbox', { name: '链接显示文本' })).toHaveValue('one two three');
  await form.getByRole('textbox', { name: '链接地址' }).fill('https://example.com/new');
  await form.getByRole('button', { name: '保存', exact: true }).click();
  const links = page.locator('.ProseMirror a');
  for (const link of await links.all()) await expect(link).toHaveAttribute('href', 'https://example.com/new');
  await expect(page.locator('.ProseMirror strong')).toHaveText('two');
  await links.last().click({ position: { x: 8, y: 8 } });
  await expect(page.getByRole('toolbar', { name: '链接', exact: true })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  await form.getByRole('button', { name: '取消链接', exact: true }).click();
  await form.getByRole('button', { name: '确认取消链接', exact: true }).click();
  await expect(page.locator('.ProseMirror a')).toHaveCount(0);
  await expect(page.locator('.ProseMirror strong')).toHaveText('two');
});
