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

test('custom engine image and emoji output cannot execute event handlers', async ({ page }) => {
  await page.route('**/security-image.png', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: 'not an image' }),
  );
  await setMarkdown(page, '');
  const value = '![picture](/security-image.png)\n\n:smile:';
  await page.evaluate((source) => {
    (window as Window & { securityProbe?: number }).securityProbe = 0;
    window.milkdownEditor!.engine.makeHtml = () =>
      '<img src="/security-image.png" class="engine-image" onerror="window.securityProbe++">';
    window.milkdownEditor!.setMarkdown(source);
  }, value);
  const image = page.locator('.ProseMirror > p > img.engine-image');
  const emoji = page.locator('.cherry-embed--cherry_emoji img.engine-image');
  await expect(image).toHaveCount(1);
  await expect(emoji).toHaveCount(1);
  for (const node of [image, emoji]) {
    await expect(node).not.toHaveAttribute('onerror');
    await node.evaluate((element: HTMLImageElement) => element.decode().catch(() => {}));
  }
  expect(await page.evaluate(() => (window as Window & { securityProbe?: number }).securityProbe)).toBe(0);
  expect(await markdown(page)).toBe(value);
});

test('custom engine SVG cannot animate an executable link', async ({ page }) => {
  await setMarkdown(page, '');
  await page.evaluate(() => {
    (window as Window & { securityProbe?: number }).securityProbe = 0;
    window.milkdownEditor!.engine.makeHtml = () =>
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60">' +
      '<a><animate attributeName="href" values="javascript:window.securityProbe%2B%2B" dur="1s" fill="freeze"/>' +
      '<text x="10" y="30">probe link</text></a>' +
      '<foreignObject width="100" height="20"><div xmlns="http://www.w3.org/1999/xhtml">label</div></foreignObject>' +
      '</svg>';
    window.milkdownEditor!.setMarkdown(':smile:');
  });
  const svg = page.locator('.cherry-embed--cherry_emoji svg');
  await expect(svg).toBeVisible();
  await expect(svg.locator('animate, set')).toHaveCount(0);
  await expect(svg.locator('foreignObject')).toContainText('label');
  const label = svg.locator('text');
  await label.scrollIntoViewIfNeeded();
  const box = await label.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect.poll(() => page.evaluate(() => (window as Window & { securityProbe?: number }).securityProbe)).toBe(0);
  expect(await markdown(page)).toBe(':smile:');
});

test('custom engine SVG styles cannot affect the surrounding page', async ({ page }) => {
  await setMarkdown(page, '');
  await page.evaluate(() => {
    document.body.dataset.engineStyleProbe = 'true';
    window.milkdownEditor!.engine.makeHtml = () =>
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">' +
      '<style>body[data-engine-style-probe] { outline: 17px solid rgb(255, 0, 0) }</style>' +
      '<text x="1" y="20">label</text></svg>';
    window.milkdownEditor!.setMarkdown(':smile:');
  });
  await expect(page.locator('.cherry-embed--cherry_emoji svg text')).toHaveText('label');
  await expect(page.locator('body')).not.toHaveCSS('outline-width', '17px');
});

test('custom engine fixed positioning cannot cover the host page', async ({ page }) => {
  await setMarkdown(page, '');
  await page.evaluate(() => {
    window.milkdownEditor!.engine.makeHtml = () =>
      '<span data-engine-overlay style="position:fixed;inset:0;z-index:2147483647;background:red">emoji</span>';
    window.milkdownEditor!.setMarkdown(':smile:');
  });
  await expect(page.locator('.cherry-embed--cherry_emoji [data-engine-overlay]')).toHaveText('emoji');
  expect(await page.evaluate(() => document.elementFromPoint(1, 1)?.hasAttribute('data-engine-overlay'))).toBe(false);
});

test('a heading with an unpaired surrogate does not prevent document and TOC rendering', async ({ page }) => {
  const value = '# Bad\ud800\n\n[[toc]]';
  await setMarkdown(page, value);
  await expect.poll(() => markdown(page)).toBe(value);
  await expect(page.locator('.ProseMirror h1')).toHaveText('Bad\ud800');
  await expect(page.locator('.toc')).toContainText('Bad\ud800');
  await expect(page.locator('.toc a')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.toc a')).not.toHaveAttribute('href');
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
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '取消链接' }).click();
  await expect(page.locator('.ProseMirror a')).toHaveCount(0);
  await expect(page.locator('.ProseMirror strong')).toHaveText('two');
});
