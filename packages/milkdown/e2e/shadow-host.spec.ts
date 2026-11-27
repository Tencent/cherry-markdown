import type { Page } from '@playwright/test';
import { expect, markdown, replaceTableCell, setMarkdown, test } from './fixtures';

test.use({ actionTimeout: 8_000 });

async function openDemo(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  expect(await page.locator('[data-cherry-milkdown]').evaluate((element) => Boolean(element.shadowRoot))).toBe(true);
}

test('the published entry isolates styles and allows overrides through variables and parts', async ({ page }, info) => {
  await openDemo(page);
  const value = '# Heading\n\nPlain text.\n\n- [x] Done';
  await setMarkdown(page, value);
  const paragraph = page.locator('.ProseMirror > p').first();
  const heading = page.locator('.ProseMirror h1');
  const content = page.locator('.ProseMirror');
  const style = () =>
    content.evaluate((element) => {
      const css = getComputedStyle(element);
      return { color: css.color, fontSize: css.fontSize, padding: css.paddingTop, background: css.backgroundColor };
    });
  const initial = await style();
  const headingSize = await heading.evaluate((element) => getComputedStyle(element).fontSize);
  await page.addStyleTag({
    content: `
      #markdown { --spacing-lg: 160px; --md-paragraph-color: lime; --base-previewer-bg: lime; }
      .cherry-previewer, .cherry-markdown h1 { color: magenta !important; font-size: 70px !important; }
    `,
  });
  expect(await style()).toEqual(initial);
  expect(await heading.evaluate((element) => getComputedStyle(element).fontSize)).toBe(headingSize);
  const taskIcon = page.locator('.ProseMirror li .ch-icon').first();
  await expect(taskIcon).toBeVisible();
  expect(await taskIcon.evaluate((element) => getComputedStyle(element, '::before').fontFamily)).toBe(
    'cherry-milkdown-icons',
  );
  expect(
    await page.evaluate(() =>
      [...document.fonts].some((font) => font.family === 'cherry-milkdown-icons' && font.status === 'loaded'),
    ),
  ).toBe(true);
  const beforeFocus = await paragraph.boundingBox();
  await paragraph.click();
  expect(await paragraph.boundingBox()).toEqual(beforeFocus);
  await expect(content).toBeFocused();
  await info.attach('isolated-default', { body: await page.screenshot(), contentType: 'image/png' });

  await page.addStyleTag({
    content: `
      #markdown { --milkdown-font-size: 19px; --milkdown-text-color: rgb(11, 22, 33); --milkdown-background: rgb(232, 233, 234); }
      #markdown > [data-cherry-milkdown]::part(content) { padding-top: 34px; }
      #markdown > [data-cherry-milkdown]::part(toolbar) { border-radius: 21px; }
    `,
  });
  expect(await style()).toEqual({
    color: 'rgb(11, 22, 33)',
    fontSize: '19px',
    padding: '34px',
    background: 'rgb(232, 233, 234)',
  });
  await paragraph.click({ position: { x: 2, y: 8 } });
  await page.keyboard.press('Shift+ArrowRight');
  const toolbar = page.getByRole('toolbar', { name: '文本格式' });
  await expect(toolbar).toHaveCSS('border-radius', '21px');
  expect(await markdown(page)).toBe(value);
  await info.attach('customized-parts', { body: await page.screenshot(), contentType: 'image/png' });
});

test('native selection, formatting, link form and undo work through the shadow boundary', async ({ page }) => {
  await openDemo(page);
  const value = 'Select this text.';
  await setMarkdown(page, value);
  const editor = page.locator('.ProseMirror');
  const paragraph = editor.locator('p').first();
  await paragraph.click({ position: { x: 2, y: 8 } });
  for (const _ of 'Select this text.') await page.keyboard.press('Shift+ArrowRight');
  await page.getByRole('toolbar', { name: '文本格式' }).getByRole('button', { name: '加粗' }).click();
  await expect(paragraph.locator('strong')).toHaveText('Select this text.');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await markdown(page)).toBe(value);

  const linkSource = '[Link](https://example.com)';
  await setMarkdown(page, linkSource);
  await editor.getByRole('link', { name: 'Link' }).click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  const address = form.getByLabel('链接地址');
  await address.click();
  await address.fill('./changed.md');
  await expect(address).toBeFocused();
  await expect(form).toBeVisible();
  await page.evaluate(() => {
    document.body.style.minHeight = '160vh';
    window.scrollTo(0, 80);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(address).toBeFocused();
  await expect(address).toHaveValue('./changed.md');
  await page.keyboard.press('Escape');
  await expect(form).toBeHidden();
  await expect(editor).toBeFocused();
  expect(await markdown(page)).toBe(linkSource);
});

test('image controls keep focus inside their form until it is dismissed', async ({ page }) => {
  await openDemo(page);
  await setMarkdown(page, '![dog#100px](assets/images/demo-dog.png)');
  const image = page.locator('.ProseMirror img[src]');
  await image.click();
  await page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '编辑图片' }).click();
  const form = page.getByRole('dialog', { name: '编辑图片' });
  const address = form.getByLabel('图片地址');
  await address.click();
  await expect(form).toBeVisible();
  await expect(address).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(form).toBeHidden();
  expect(await markdown(page)).toBe('![dog#100px](assets/images/demo-dog.png)');
});

test('pointer drag, table edits and source edits preserve the document', async ({ page }) => {
  await openDemo(page);
  await setMarkdown(
    page,
    'First paragraph.\n\nSecond paragraph.\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```custom-preview\nStart\n```',
  );
  const paragraphs = page.locator('.ProseMirror > p');
  const first = paragraphs.first();
  await first.click();
  await first.hover();
  const handle = await first.locator('[data-cherry-block-drag-handle]').boundingBox();
  const second = await paragraphs.nth(1).boundingBox();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2);
  await page.mouse.down();
  await page.mouse.move(second!.x + 35, second!.y + second!.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(first).toHaveText('Second paragraph.');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(first).toHaveText('First paragraph.');

  await replaceTableCell(page, page.locator('.milkdown-table-block td p').first(), '9');
  await expect.poll(() => markdown(page)).toContain('| 9 | 2 |');

  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+Home');
  await page.keyboard.type('X');
  await source.press('ControlOrMeta+End');
  await page.keyboard.type('Y');
  await expect(source).toHaveText('XStartY');
  await source.press('ControlOrMeta+Shift+Home');
  await expect.poll(() => page.evaluate(() => document.getSelection()?.toString())).toBe('XStartY');
  await source.press('ControlOrMeta+a');
  await page.keyboard.type('Updated');
  await expect(page.locator('[data-custom-preview]')).toHaveText('Updated');
  await expect(source).toBeFocused();
  await expect.poll(() => markdown(page)).toContain('custom-preview\nUpdated');
});

test('Chromium composition commits Chinese once in both prose and embedded source', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium native input protocol.');
  await openDemo(page);
  await setMarkdown(page, 'Start\n\n```custom-preview\nAlpha\n```');
  const input = await page.context().newCDPSession(page);
  const compose = async () => {
    await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
    await input.send('Input.insertText', { text: '你好' });
  };
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await compose();
  await expect(paragraph).toHaveText('Start你好');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph).toHaveText('Start');

  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+End');
  await compose();
  await expect(source).toHaveText('Alpha你好');
  await expect.poll(() => markdown(page)).toContain('custom-preview\nAlpha你好');
  expect((await markdown(page)).match(/你好/g)).toHaveLength(1);
  await input.detach();
});

test('Chromium copies, pastes and cuts real selections through the browser clipboard', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright clipboard permissions are exercised in Chromium.');
  await openDemo(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await setMarkdown(page, 'Paste this');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click({ position: { x: 2, y: 8 } });
  for (const _ of 'Paste this') await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(() => page.evaluate(() => document.getSelection()?.toString())).toBe('Paste this');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Paste this');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('/');
  await page.keyboard.press('ControlOrMeta+v');
  await expect(paragraph).toHaveText('Paste this/Paste this');
  expect(await markdown(page)).toContain('Paste this/Paste this');

  await setMarkdown(page, 'Cut this');
  await paragraph.click({ position: { x: 2, y: 8 } });
  for (const _ of 'Cut this') await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(() => page.evaluate(() => document.getSelection()?.toString())).toBe('Cut this');
  await page.keyboard.press('ControlOrMeta+x');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Cut this');
  await expect.poll(async () => (await markdown(page)).trim()).toBe('');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(async () => (await markdown(page)).trim()).toBe('Cut this');
});
