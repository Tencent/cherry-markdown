import { test, expect, markdown, setMarkdown } from './fixtures';
import { cherryCompatibilityCases } from '../test/fixtures/compatibility';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor), undefined, { timeout: 30_000 });
  await expect(page.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
});

test('standalone editor boots without Cherry editor, Previewer or top toolbar', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.reload();
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
  await expect(page.locator('h1').filter({ hasText: 'Cherry Markdown' })).toBeVisible();
  await expect(page.locator('.cm-editor:visible,.cherry-toolbar:visible')).toHaveCount(0);
  expect(await page.locator('body').evaluate((body) => getComputedStyle(body).margin)).toBe('0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  await expect(
    page.locator('#markdown > .cherry.cherry-milkdown .cherry-previewer.cherry-markdown.ProseMirror'),
  ).toHaveCount(1);
  const root = page.locator('#markdown > .cherry.cherry-milkdown');
  const editor = page.locator('.ProseMirror.cherry-previewer');
  await expect(root).toHaveClass(/theme__default/);
  await expect(root).toHaveClass(/cherry--no-toolbar/);
  await expect(editor).toHaveClass(/cherry-previewer--full/);
  expect(await editor.evaluate((element) => element.getBoundingClientRect().width)).toBe(
    await root.evaluate((element) => element.getBoundingClientRect().width),
  );
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('runtime theme switching updates both Cherry scopes without editing Markdown', async ({ page }) => {
  await setMarkdown(page, '# Theme');
  await page.evaluate(() => window.milkdownEditor?.setTheme('dark'));
  await expect(page.locator('#markdown > .cherry.cherry-milkdown')).toHaveClass(/theme__dark/);
  await expect(page.locator('.ProseMirror.cherry-markdown')).toHaveClass(/theme__dark/);
  expect(await markdown(page)).toBe('# Theme');

  await page.evaluate(() => window.milkdownEditor?.setTheme('default'));
  await expect(page.locator('#markdown > .cherry.cherry-milkdown')).toHaveClass(/theme__default/);
  await expect(page.locator('.ProseMirror.cherry-markdown')).toHaveClass(/theme__default/);
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
  // A real triple-click selects the paragraph without depending on the
  // platform-specific Home/End behavior used by the Playwright browser host.
  await paragraph.click({ clickCount: 3 });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe('Selected text');
  const bubble = page.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveClass(/cherry-milkdown-text-bubble/);
  await expect(bubble).toHaveCSS('border-color', 'rgb(51, 154, 240)');
  await expect(bubble.locator('[title="加粗"]')).toHaveCSS('height', '38px');
  const buttonWidths = await bubble
    .locator('button')
    .evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().width)));
  expect(new Set(buttonWidths)).toEqual(new Set([38]));
  const glyphSizes = await bubble.locator('.cherry-milkdown-text-bubble__glyph').evaluateAll((glyphs) =>
    glyphs.map((glyph) => {
      const rect = glyph.getBoundingClientRect();
      return [Math.round(rect.width), Math.round(rect.height)];
    }),
  );
  expect(glyphSizes).toEqual([
    [32, 32],
    [32, 32],
    [32, 32],
    [32, 32],
  ]);
  await expect(bubble.locator('[title="加粗"] .cherry-milkdown-text-bubble__glyph')).toHaveCSS('font-weight', '700');
  await expect(bubble.locator('[title="斜体"] .cherry-milkdown-text-bubble__glyph')).toHaveCSS('font-style', 'italic');
  await expect(bubble.locator('[title="下划线"] .cherry-milkdown-text-bubble__glyph')).toHaveCSS(
    'text-decoration-line',
    'underline',
  );
  await expect(bubble.locator('[title="删除线"] .cherry-milkdown-text-bubble__glyph')).toHaveCSS(
    'text-decoration-line',
    'line-through',
  );
  const paragraphBox = await paragraph.boundingBox();
  expect(paragraphBox).not.toBeNull();
  await page.mouse.move(paragraphBox!.x + paragraphBox!.width - 4, paragraphBox!.y + paragraphBox!.height / 2);
  await expect(bubble).toBeVisible();
  expect(await paragraph.boundingBox()).toEqual(before);
  await bubble.locator('[title="加粗"]').click();
  await expect(paragraph.locator('strong')).toHaveText('Selected text');
  expect(await markdown(page)).toContain('**Selected text**');
  await expect(page.locator('.ProseMirror')).toBeFocused();
  // Let focus restoration finish before exercising Milkdown history.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph.locator('strong')).toHaveCount(0);
});

test('Bubble hides on scroll and never becomes detached from its selection', async ({ page }) => {
  await setMarkdown(page, Array.from({ length: 80 }, (_, index) => `Paragraph ${index}`).join('\n\n'));
  const paragraph = page.locator('.ProseMirror > p').nth(10);
  await paragraph.scrollIntoViewIfNeeded();
  await paragraph.click({ clickCount: 3 });
  const bubble = page.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();
  const before = await bubble.boundingBox();
  expect(before).not.toBeNull();

  const scrollEditor = (delta: number) =>
    page.evaluate((amount) => {
      const target = document.querySelector('.ProseMirror > p:nth-child(11)');
      let scroller = target?.parentElement ?? null;
      while (scroller && scroller.scrollHeight <= scroller.clientHeight) scroller = scroller.parentElement;
      if (!scroller) throw new Error('No scrollable Milkdown ancestor');
      scroller.scrollTop += amount;
      return scroller.scrollTop;
    }, delta);

  expect(await scrollEditor(80)).toBeGreaterThan(0);
  await expect(bubble).toBeHidden();
});

test('Bubble active marks use an inset visual state without changing hit targets', async ({ page }) => {
  await setMarkdown(page, '***Selected text***');
  const text = page.locator('.ProseMirror > p').first();
  await text.click({ clickCount: 3 });
  const bubble = page.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();

  for (const title of ['加粗', '斜体']) {
    const button = bubble.locator(`[title="${title}"]`);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveCSS('width', '38px');
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect
      .poll(() =>
        button
          .locator('.cherry-milkdown-text-bubble__glyph')
          .evaluate((glyph) => getComputedStyle(glyph).backgroundColor),
      )
      .not.toBe('rgba(0, 0, 0, 0)');
  }
  await expect(bubble.locator('[title="下划线"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(bubble.locator('[title="删除线"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(bubble.locator('[title="下划线"] .cherry-milkdown-text-bubble__glyph')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
});

for (const item of [
  { title: '加粗', selector: 'strong', markdown: '**Selected text**' },
  { title: '斜体', selector: 'em', markdown: '*Selected text*' },
  { title: '下划线', selector: '.cherry-wysiwyg-underline', markdown: '/Selected text/' },
  { title: '删除线', selector: 'del', markdown: '~~Selected text~~' },
]) {
  test(`Bubble applies only the supported ${item.title} mark`, async ({ page }) => {
    await setMarkdown(page, 'Selected text');
    const paragraph = page.locator('.ProseMirror > p').first();
    await paragraph.click({ clickCount: 3 });
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe('Selected text');
    const bubble = page.getByRole('toolbar', { name: '文本格式' });
    await expect(bubble).toBeVisible();
    await expect(bubble.locator('button')).toHaveCount(4);
    await bubble.locator(`[title="${item.title}"]`).click();
    await expect(paragraph.locator(item.selector)).toHaveText('Selected text');
    await expect.poll(() => markdown(page)).toBe(item.markdown);
  });
}

test('real CRUD and navigation keep ordinary nodes stable', async ({ page }) => {
  await setMarkdown(
    page,
    '# Heading\n\n- first\n- second\n\n:::warning Panel\nPanel body\n:::\n\n+++ Detail\nDetail body\n+++',
  );
  const assertStable = async () => {
    await expect(page.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  };

  const heading = page.locator('.ProseMirror > h1').first();
  await heading.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' updated');
  await expect(heading).toHaveText('Heading updated');

  const firstItem = page.locator('.ProseMirror li').first().locator('p');
  await firstItem.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await expect(firstItem).toContainText('first edited');

  const label = page.locator('.cherry-compound-item__label').last();
  await label.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' renamed');
  await expect(label).toHaveValue('Detail renamed');

  const disclosure = page.locator('.cherry-compound-item__disclosure').last();
  const initiallyOpen = await disclosure.getAttribute('aria-expanded');
  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', initiallyOpen === 'true' ? 'false' : 'true');
  // The first transaction updates the NodeView in place. Re-resolve the
  // control after that update so the second user click cannot target a stale
  // button during a synchronous DOM replacement.
  const refreshedDisclosure = page.locator('.cherry-compound-item__disclosure').last();
  await expect(refreshedDisclosure).toHaveAttribute('aria-expanded', initiallyOpen === 'true' ? 'false' : 'true');
  await refreshedDisclosure.click();
  await expect(refreshedDisclosure).toHaveAttribute('aria-expanded', initiallyOpen ?? 'false');

  await heading.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  // ProseMirror keeps one empty heading block as a valid insertion point.
  await expect(page.locator('.ProseMirror > h1')).toHaveText('');
  await assertStable();

  await setMarkdown(page, '# Target\n\n[Jump](#destination)\n\n## Destination');
  const anchor = page.locator('.ProseMirror a[href="#destination"]').first();
  await expect(anchor).toBeVisible();
  await anchor.click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#destination');
  await expect(page.locator('h2#destination')).toBeInViewport();
  await assertStable();
});

test('ordinary pointer selection stays text selection and block movement requires its handle', async ({
  page,
}, testInfo) => {
  await setMarkdown(page, 'First paragraph stays selectable.\n\nSecond paragraph is the drop target.');
  const first = page.locator('.ProseMirror > p').first();
  const second = page.locator('.ProseMirror > p').nth(1);
  const box = await first.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + 8, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + Math.min(150, box!.width - 8), box!.y + box!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => document.getSelection()?.toString().length ?? 0)).toBeGreaterThan(0);
  await expect
    .poll(() => markdown(page))
    .toBe('First paragraph stays selectable.\n\nSecond paragraph is the drop target.');

  const handle = first.locator('[data-cherry-block-drag-handle]');
  await first.hover();
  await expect(handle).toBeVisible();
  const handleBox = await handle.boundingBox();
  const targetBox = await second.boundingBox();
  const start = { x: handleBox!.x + handleBox!.width / 2, y: handleBox!.y + handleBox!.height / 2 };
  const end = { x: targetBox!.x + targetBox!.width / 2, y: targetBox!.y + targetBox!.height / 2 };
  if (testInfo.project.name === 'chromium-touch') {
    await handle.dispatchEvent('pointerdown', {
      pointerId: 7,
      pointerType: 'touch',
      button: 0,
      buttons: 1,
      clientX: start.x,
      clientY: start.y,
    });
    await second.dispatchEvent('pointermove', {
      pointerId: 7,
      pointerType: 'touch',
      button: 0,
      buttons: 1,
      clientX: end.x,
      clientY: end.y,
    });
    await second.dispatchEvent('pointerup', {
      pointerId: 7,
      pointerType: 'touch',
      button: 0,
      buttons: 0,
      clientX: end.x,
      clientY: end.y,
    });
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });
    await page.mouse.up();
  }
  await expect
    .poll(() => markdown(page))
    .toBe('Second paragraph is the drop target.\n\nFirst paragraph stays selectable.');
});

test('link inspector exposes and updates both visible text and href', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await setMarkdown(page, '- [Mermaid 讲解](https://old.example/path){target=_blank}');
  const link = page.locator('.ProseMirror a').first();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  const inspector = page.getByRole('toolbar', { name: '链接' });
  await expect(dialog).toBeHidden();
  const linkBefore = await link.boundingBox();

  // Hover alone does not add an icon or mutate the document layout.
  await link.hover();
  await expect(inspector).toBeHidden();
  const linkAfter = await link.boundingBox();
  expect(linkAfter).toEqual(linkBefore);

  // A collapsed caret inside the link opens its inspector without requiring
  // an extra inline icon.
  await link.click({ position: { x: 8, y: 8 } });
  await expect(inspector).toBeVisible();
  await expect(inspector).toHaveClass(/cherry-milkdown-context-bubble/);
  await expect(inspector).toHaveCSS('position', 'fixed');
  await expect(inspector).toHaveCSS('border-color', 'rgb(51, 154, 240)');
  await expect(inspector.locator('.cherry-bubble-bottom,.cherry-bubble-top')).toBeVisible();
  const inspectorBox = await inspector.boundingBox();
  expect(inspectorBox?.height).toBe(48);
  const buttonBoxes = await inspector.getByRole('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, center: rect.top + rect.height / 2 };
    }),
  );
  expect(buttonBoxes.map(({ width }) => width)).toEqual([38, 38]);
  expect(buttonBoxes.map(({ height }) => height)).toEqual([38, 38]);
  await expect(inspector.locator('.cherry-milkdown-context-button__content')).toHaveCount(2);
  expect(
    await inspector.locator('.cherry-milkdown-context-button__content').evaluateAll((contents) =>
      contents.map((content) => {
        const rect = content.getBoundingClientRect();
        return [Math.round(rect.width), Math.round(rect.height)];
      }),
    ),
  ).toEqual([
    [32, 32],
    [32, 32],
  ]);
  expect(
    Math.max(...buttonBoxes.map(({ center }) => center)) - Math.min(...buttonBoxes.map(({ center }) => center)),
  ).toBeLessThanOrEqual(0.5);
  await expect(inspector.getByRole('link')).toHaveText('https://old.example/path');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
  await inspector.getByRole('button', { name: '复制链接' }).click();
  await expect(inspector.getByRole('button', { name: '已复制' })).toBeVisible();
  await expect(inspector.getByRole('button', { name: '已复制' })).toHaveClass(/is-success/);
  await expect(inspector.locator('.ch-icon-ok')).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('https://old.example/path');
  await inspector.getByRole('button', { name: '编辑链接' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/cherry-milkdown-context-form/);
  await expect(inspector).toBeHidden();
  await expect(dialog.getByRole('button', { name: '取消链接' })).toBeVisible();
  await dialog.getByRole('button', { name: '取消链接' }).click();
  await expect(dialog.getByRole('button', { name: '保留链接' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '确认取消链接' })).toBeVisible();
  await dialog.getByRole('button', { name: '保留链接' }).click();
  await expect(dialog.getByRole('button', { name: '取消链接' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '保存' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
  await expect(dialog.getByLabel('链接显示文本')).toHaveValue('Mermaid 讲解');
  await expect(dialog.getByLabel('链接地址')).toHaveValue('https://old.example/path');
  await expect(dialog.getByLabel('链接打开方式')).toHaveValue('_blank');
  const linkEditorControlHeights = await dialog
    .locator('input, select, button')
    .evaluateAll((controls) => controls.map((control) => control.getBoundingClientRect().height));
  expect(new Set(linkEditorControlHeights).size).toBe(1);

  await dialog.getByLabel('链接显示文本').fill('Mermaid 文档');
  await dialog.getByLabel('链接地址').fill('https://new.example/guide');
  await dialog.getByLabel('链接打开方式').selectOption('self');
  await dialog.getByRole('button', { name: '保存' }).click();

  await expect(link).toHaveText('Mermaid 文档');
  await expect(link).toHaveAttribute('href', 'https://new.example/guide');
  expect(await markdown(page)).toContain('[Mermaid 文档](https://new.example/guide){target=self}');

  await page.keyboard.press('ControlOrMeta+k');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('链接地址')).toHaveValue('https://new.example/guide');
  await expect(dialog.getByLabel('链接打开方式')).toHaveValue('self');
  await dialog.getByLabel('链接打开方式').selectOption('');
  await dialog.getByRole('button', { name: '保存' }).click();
  await expect(dialog).toBeHidden();
  expect(await markdown(page)).toContain('[Mermaid 文档](https://new.example/guide)');
  expect(await markdown(page)).not.toContain('{target=');

  // The inspector remains an overlay and cannot move adjacent prose.
  await setMarkdown(page, 'Before [inline link](https://example.com) following prose.');
  const paragraphBefore = await page.locator('.ProseMirror p').boundingBox();
  await link.click({ position: { x: 8, y: 8 } });
  await expect(inspector).toBeVisible();
  const paragraphAfter = await page.locator('.ProseMirror p').boundingBox();
  expect(paragraphAfter).toEqual(paragraphBefore);
  const inlineInspectorBox = await inspector.boundingBox();
  const followingTextBox = await page.locator('.ProseMirror p').evaluate((paragraph) => {
    const text = [...paragraph.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.includes('following prose'),
    );
    if (!text) return undefined;
    const range = document.createRange();
    range.selectNodeContents(text);
    const rect = range.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  expect(
    inlineInspectorBox &&
      followingTextBox &&
      (inlineInspectorBox.x + inlineInspectorBox.width <= followingTextBox.x ||
        inlineInspectorBox.x >= followingTextBox.x + followingTextBox.width ||
        inlineInspectorBox.y + inlineInspectorBox.height <= followingTextBox.y ||
        inlineInspectorBox.y >= followingTextBox.y + followingTextBox.height),
  ).toBe(true);

  await setMarkdown(
    page,
    [...Array.from({ length: 30 }, (_, index) => `Paragraph ${index}`), '[scroll link](https://example.com)'].join(
      '\n\n',
    ),
  );
  const scrollLink = page.locator('.ProseMirror a').last();
  await scrollLink.scrollIntoViewIfNeeded();
  await scrollLink.click({ position: { x: 8, y: 8 } });
  await expect(inspector).toBeVisible();
  await page.mouse.wheel(0, -120);
  await expect(inspector).toBeHidden();
});

test('link inspector keeps adjacent links isolated and reports invalid input', async ({ page }) => {
  await setMarkdown(page, '[first](https://one.example) [second](https://two.example)');
  const links = page.locator('.ProseMirror a');
  await expect(links).toHaveCount(2);

  const second = links.nth(1);
  await second.click({ position: { x: 8, y: 8 } });
  const inspector = page.getByRole('toolbar', { name: '链接' });
  await expect(inspector).toBeVisible();
  await inspector.getByRole('button', { name: '编辑链接' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  await expect(dialog.getByLabel('链接地址')).toHaveValue('https://two.example');

  await dialog.getByLabel('链接地址').fill('javascript:alert(1)');
  await dialog.getByRole('button', { name: '保存' }).click();
  await expect(dialog.locator('.cherry-milkdown-link-editor__error')).toHaveText('请输入有效的链接地址。');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  // A normal caret focus, rather than a text selection, is sufficient to
  // reopen the link Bubble. Move through the adjacent link so the assertion
  // also covers ownership transfer between two link marks.
  await links.first().click({ position: { x: 8, y: 8 } });
  await second.click({ position: { x: 8, y: 8 } });
  await expect(inspector).toBeVisible();
  await inspector.getByRole('button', { name: '编辑链接' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '取消链接' }).click();
  await dialog.getByRole('button', { name: '确认取消链接' }).click();
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveAttribute('href', 'https://one.example');
  expect(await markdown(page)).toContain('[first](https://one.example) second');
});

test('code typing is monotonic and cannot open text Bubble', async ({ page }, testInfo) => {
  await setMarkdown(page, 'Use `x` here.');
  const code = page.locator('.ProseMirror p code');
  // Select the code token as a user would before replacing it.  A bare
  // ArrowRight intentionally leaves an inline-code mark in ProseMirror, so it
  // is not a valid assertion that subsequent text must remain code.
  await code.selectText();
  await page.keyboard.type('x');
  for (let index = 0; index < 50; index++) {
    await page.keyboard.type('a', { delay: 5 });
    expect(await markdown(page)).toContain(`x${'a'.repeat(index + 1)}`);
  }
  await setMarkdown(page, '```javascript\nconst value = 1;\n```');
  const block = page.locator('.ProseMirror pre code').first();
  await block.click({ position: { x: 8, y: 8 } });
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+End');
  // Chromium includes a layout newline when a range ends at a block <code>.
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trimEnd())).toBe('const value = 1;');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
  if (testInfo.project.name === 'chromium-touch') {
    // Mobile virtual keyboards commit text directly rather than emitting a
    // desktop keydown for every character.
    await page.keyboard.insertText('const updated = 2;');
  } else {
    await page.keyboard.type('const updated = 2;');
  }
  expect(await markdown(page)).toContain('const updated = 2;');
});

test('Mermaid renders and source editing stays open without text Bubble', async ({ page }) => {
  await setMarkdown(page, '```mermaid\ngraph LR\n A-->B\n```');
  await expect(page.locator('.cherry-embed__preview svg')).toBeVisible();
  const node = page.locator('.cherry-embed--cherry_diagram');
  const toggle = page.getByRole('button', { name: '在节点内编辑源码', exact: true });
  await expect(node.locator('.cherry-embed__controls')).toHaveText('源码');
  await expect(node.locator('.cherry-embed__type')).toHaveCount(0);
  const beforeHover = await node.boundingBox();
  await node.hover();
  const afterHover = await node.boundingBox();
  expect(afterHover).toEqual(beforeHover);
  await expect(node.locator('.cherry-embed__controls')).toHaveCSS('position', 'absolute');
  const controlBox = await node.locator('.cherry-embed__controls').boundingBox();
  expect(controlBox!.height).toBeLessThanOrEqual(30);
  await node.locator('.cherry-embed__preview svg').click();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeHidden();
  await toggle.click();
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
  await toggle.click();
  await expect(source).toBeHidden();
  await expect(node).not.toHaveClass(/is-selected/);
});

test('configured custom fenced renderers hot-update from their local source editor', async ({ page }) => {
  await setMarkdown(page, '```custom-preview\nold\n```');
  const node = page.locator('.cherry-embed--cherry_diagram');
  await expect(node.locator('[data-custom-preview]')).toHaveText('old');

  await node.getByRole('button', { name: '在节点内编辑源码', exact: true }).click();
  const source = node.locator('.cherry-embed__source code');
  await source.press('ControlOrMeta+a');
  await source.pressSequentially('new value');

  await expect(node.locator('[data-custom-preview]')).toHaveText('new value');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('```custom-preview\nnew value\n```');
  await expect(node.getByRole('button', { name: '在节点内编辑源码', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
});

for (const directive of [
  {
    name: 'columns',
    selector: '.cherry-panel-cols',
    markdown: ':::cols\nLeft\n::\nRight\n:::',
  },
  {
    name: 'tabs',
    selector: '.cherry-tabs',
    markdown: ':::tabs\n:: One\nFirst\n:: Two\nSecond\n:::',
  },
  {
    name: 'timeline',
    selector: '.cherry-timeline',
    markdown:
      ':::timeline Cherry Markdown 发展历程\n:: [milestone] 2021-07 项目开源\nDescription\n:: [done] 2024-05 支持流式\nDone\n:: [doing] 持续迭代\nWorking\n:: [error] VSCode\nError\n:: [todo] 拥抱社区\nTodo\n:::',
  },
]) {
  test(`Cherry owns the complete native ${directive.name} structure`, async ({ page }) => {
    await setMarkdown(page, directive.markdown);
    const result = await page.evaluate(({ markdown, selector }) => {
      const actual = document.querySelector(`.cherry-embed__preview ${selector}`);
      const oracle = document.createElement('div');
      oracle.innerHTML = window.milkdownEditor!.engine.makeHtml(markdown);
      const expected = oracle.querySelector(selector);
      const signature = (root: Element | null) =>
        root
          ? [root, ...root.querySelectorAll('*')].map((element) => ({
              tag: element.tagName,
              classes: [...element.classList].sort(),
            }))
          : [];
      return {
        actual: signature(actual),
        expected: signature(expected),
        actualText: actual?.textContent?.replace(/\s+/g, ' ').trim(),
        expectedText: expected?.textContent?.replace(/\s+/g, ' ').trim(),
      };
    }, directive);
    expect(result.actual).toEqual(result.expected);
    expect(result.actualText).toBe(result.expectedText);
    await expect(page.getByRole('button', { name: '编辑整个区块源码', exact: true })).toBeVisible();
  });
}

test('image controls update Cherry-compatible layout directives without Cherry UI internals', async ({ page }) => {
  await setMarkdown(page, '![dog#100px](assets/images/demo-dog.png)');
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  const frame = page.locator('.cherry-milkdown-image-frame');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/cherry-milkdown-context-bubble/);
  await expect(toolbar).toHaveCSS('position', 'fixed');
  expect((await toolbar.boundingBox())?.y).toBeGreaterThanOrEqual(0);
  await expect(frame).toBeVisible();
  await expect(toolbar.getByRole('button', { name: '浮动左对齐' })).toBeVisible();
  await expect(toolbar.getByRole('button', { name: '浮动右对齐' })).toBeVisible();
  expect(
    await toolbar.getByRole('button').evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        const contentRect = button.firstElementChild?.getBoundingClientRect();
        return [
          Math.round(rect.width),
          Math.round(rect.height),
          Math.round(contentRect?.width ?? 0),
          Math.round(contentRect?.height ?? 0),
        ];
      }),
    ),
  ).toEqual(Array.from({ length: 9 }, () => [38, 38, 32, 32]));
  await toolbar.getByRole('button', { name: '边框' }).click();
  await expect(toolbar.getByRole('button', { name: '边框' })).toHaveAttribute('aria-pressed', 'true');
  expect(await markdown(page)).toContain('#B');
  await toolbar.getByRole('button', { name: '居中' }).click();
  await expect(toolbar.getByRole('button', { name: '居中' })).toHaveAttribute('aria-pressed', 'true');
  expect(await markdown(page)).toContain('#center');
  await expect
    .poll(async () => {
      const imageBox = await image.boundingBox();
      const frameBox = await frame.boundingBox();
      if (!imageBox || !frameBox) return false;
      return (
        Math.abs(imageBox.x - frameBox.x) <= 1 &&
        Math.abs(imageBox.y - frameBox.y) <= 1 &&
        Math.abs(imageBox.width - frameBox.width) <= 1 &&
        Math.abs(imageBox.height - frameBox.height) <= 1
      );
    })
    .toBe(true);
  const handle = frame.locator('[data-resize-handle="rightMiddle"]');
  const box = await handle.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => markdown(page)).toMatch(/dog#1[3-9]\dpx/);

  await toolbar.getByRole('button', { name: '编辑图片' }).click();
  const source = page.getByRole('dialog', { name: '编辑图片' });
  await expect(source).toBeVisible();
  await expect(source).toHaveClass(/cherry-milkdown-context-form/);
  await expect(frame).toBeHidden();
  await expect(toolbar).toBeHidden();
  const sourceControlRects = await source
    .locator('input:not([type="file"]), button:not([hidden])')
    .evaluateAll((controls) =>
      controls.map((control) => {
        const rect = control.getBoundingClientRect();
        return { height: rect.height, center: rect.top + rect.height / 2 };
      }),
    );
  expect(new Set(sourceControlRects.map(({ height }) => height)).size).toBe(1);
  await expect(source.getByRole('button', { name: '选择图片' })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await expect(source).toBeHidden();
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole('button', { name: '编辑图片' }).click();
  await source.locator('input[type="file"]').setInputFiles({
    name: 'replacement.png',
    mimeType: 'image/png',
    buffer: Buffer.from('replacement-image'),
  });
  await expect(source.locator('.cherry-milkdown-image-source__status')).toContainText('上传完成');
  await expect(source.getByLabel('图片地址')).toHaveValue(/^data:image\/png;base64,/);
  await source.getByLabel('图片替代文本').fill('updated dog');
  await source.getByRole('button', { name: '保存' }).click();
  await expect.poll(() => markdown(page)).toContain('![updated dog#');
  await expect(frame).toBeVisible();
});

test('manual ECharts example renders including its final semicolon', async ({ page }) => {
  await page.getByRole('link', { name: 'echarts直接渲染', exact: true }).click();
  await expect(
    page.locator('.cherry-embed--cherry_diagram:not([data-type="mermaid"])').first().locator('svg'),
  ).toBeVisible();
  await expect(page.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
});

test('manual line table chart renders inside Cherry-owned columns without injected controls', async ({ page }) => {
  await page.getByRole('link', { name: '折线图', exact: true }).click();
  const heading = page.locator('h3#折线图');
  const nativeBlock = heading.locator('+ .cherry-embed--cherry_native_block');
  await expect(nativeBlock.locator('.cherry-panel-cols__2cols')).toBeVisible();
  await expect(nativeBlock.locator('.cherry-echarts-wrapper svg')).toBeVisible();
  await expect(nativeBlock.locator('.cherry-table-wrapper').first()).toBeVisible();
  await expect(nativeBlock.getByRole('button', { name: '编辑当前表格图表源码', exact: true })).toHaveCount(0);
  await expect(nativeBlock.getByRole('button', { name: '编辑整个区块源码', exact: true })).toBeVisible();
  await expect(nativeBlock.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
});

test('table chart nested in Cherry columns edits through the owned block source', async ({ page }) => {
  const chart = ['| :line:{"title":"Before"} | Jan | Feb |', '| --- | --- | --- |', '| Sales | 1 | 2 |'].join('\n');
  const value = ['::: 2cols', 'Example', '```markdown', chart, '```', '::', 'Result', chart, ':::'].join('\n');
  await setMarkdown(page, value);
  const node = page.locator('.cherry-embed--cherry_native_block');
  await node.getByRole('button', { name: '编辑整个区块源码', exact: true }).click();
  const source = node.locator('.cherry-embed__source code');
  await expect(source).toBeFocused();
  const updatedChart = chart.replace('Before', 'After').replace('| Sales | 1 | 2 |', '| Sales | 8 | 13 |');
  const chartOffset = value.lastIndexOf(chart);
  const updated = `${value.slice(0, chartOffset)}${updatedChart}${value.slice(chartOffset + chart.length)}`;
  await source.fill(updated);

  await expect(node.locator('.cherry-echarts-wrapper svg')).toBeVisible();
  await expect(node.locator('.cherry-table')).toContainText('13');
  await expect.poll(() => markdown(page)).toContain('After');
  expect((await markdown(page)).match(/Before/g)).toHaveLength(1);
  await node.getByRole('button', { name: '编辑整个区块源码', exact: true }).click();
  await expect(source).toBeHidden();
});

test('typing after an external prepend keeps the caret at the original word', async ({ page }) => {
  await setMarkdown(page, 'Original text');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await setMarkdown(page, 'Prepended paragraph\n\nOriginal text');
  await page.keyboard.type('!');
  expect(await markdown(page)).toContain('Original text!');
  expect(await markdown(page)).not.toContain('Prepended par!');
});

test('Mermaid source edits preserve width and alignment and can be closed', async ({ page }) => {
  await setMarkdown(page, '```mermaid #300px#center\ngraph LR\n A-->B\n```');
  const node = page.locator('.cherry-embed--cherry_diagram');
  await expect(node.locator('svg')).toBeVisible();
  const toggle = node.getByRole('button', { name: '在节点内编辑源码', exact: true });
  await toggle.click();
  const source = node.locator('.cherry-embed__source code');
  await source.fill('graph LR\n A-->C');
  expect(await markdown(page)).toContain('mermaid #300px#center');
  await expect(node).toHaveCSS('width', '300px');
  await expect(node).toHaveClass(/cherry-mermaid-align-center/);
  await toggle.click();
  await expect(source).toBeHidden();
});

test('table chart uses the native table editor and redraws without a blank frame', async ({ page }) => {
  await setMarkdown(page, '| :line:{"title":"Trend"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |');
  const node = page.locator('.cherry-table-chart');
  await expect(node.locator('svg')).toBeVisible();
  const table = page.locator('.milkdown-table-block').first();
  const descriptor = table.locator('th p').first();
  const sales = table.locator('td p').first();
  await expect(descriptor).toContainText(':line:');
  await page.evaluate(() => {
    const chart = document.querySelector<HTMLElement>('.cherry-table-chart');
    if (!chart) throw new Error('Missing table chart');
    const result = { blankSnapshots: 0, minHeight: Number.POSITIVE_INFINITY, maxHeight: 0 };
    const inspect = () => {
      if (!chart.querySelector('.cherry-table-chart__preview svg')) result.blankSnapshots += 1;
      const height = chart.getBoundingClientRect().height;
      result.minHeight = Math.min(result.minHeight, height);
      result.maxHeight = Math.max(result.maxHeight, height);
    };
    inspect();
    const observer = new MutationObserver(inspect);
    observer.observe(chart, { childList: true, subtree: true });
    let running = true;
    const inspectFrame = () => {
      if (!running) return;
      inspect();
      requestAnimationFrame(inspectFrame);
    };
    requestAnimationFrame(inspectFrame);
    (window as typeof window & { stopChartStabilityProbe?: () => typeof result }).stopChartStabilityProbe = () => {
      running = false;
      observer.disconnect();
      inspect();
      return result;
    };
  });
  await descriptor.fill(':bar:{"title":"Changed"}');
  await sales.fill('Revenue');
  await table.locator('td p').nth(1).fill('3');
  await table.locator('td p').nth(2).fill('4');
  await expect(node.locator('svg')).toContainText('Changed');
  const stability = await page.evaluate(() =>
    (window as typeof window & { stopChartStabilityProbe?: () => Record<string, number> }).stopChartStabilityProbe?.(),
  );
  expect(stability?.blankSnapshots).toBe(0);
  expect(stability!.maxHeight - stability!.minHeight).toBeLessThan(2);
  const updatedMarkdown = await markdown(page);
  expect(updatedMarkdown).toContain('Revenue');
  expect(updatedMarkdown).toContain('| 3   | 4   |');
  await expect(table).toBeVisible();
  await expect(page.getByRole('button', { name: '编辑表格图表源码' })).toHaveCount(0);
});

test('map table chart reuses Cherry map semantics and mounts fetched GeoJSON', async ({ page }) => {
  await page.route('https://maps.example/china.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: '北京市' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [116, 39],
                  [117, 39],
                  [117, 40],
                  [116, 40],
                  [116, 39],
                ],
              ],
            },
          },
        ],
      }),
    });
  });
  await setMarkdown(
    page,
    '| :map:{"title":"China","mapDataSource":"https://maps.example/china.json"} | Value |\n' +
      '| --- | --- |\n' +
      '| 北京 | 100 |',
  );

  const chart = page.locator('.cherry-table-chart .cherry-echarts-wrapper');
  await expect(chart).toHaveAttribute('data-map-status', 'success');
  await expect(chart.locator('svg')).toBeVisible();
  await expect(page.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
});

test('all documented non-map table chart types mount through Cherry semantics', async ({ page }) => {
  const cases = [
    ['line', '| :line:{"title":"line"} | Q1 | Q2 |\n| --- | --- | --- |\n| Sales | 1 | 2 |'],
    ['bar', '| :bar:{"title":"bar"} | Q1 | Q2 |\n| --- | --- | --- |\n| Sales | 1 | 2 |'],
    ['pie', '| :pie:{"title":"pie"} | Value |\n| --- | --- |\n| Apples | 4 |\n| Pears | 2 |'],
    ['radar', '| :radar:{"title":"radar"} | A | B |\n| --- | --- | --- |\n| User | 4 | 2 |'],
    ['heatmap', '| :heatmap:{"title":"heatmap"} | A | B |\n| --- | --- | --- |\n| AM | 4 | 2 |'],
    [
      'scatter',
      '| :scatter:{"title":"scatter"} | X | Y | Size | Series |\n' +
        '| --- | --- | --- | --- | --- |\n' +
        '| A | 1 | 2 | 3 | Group |',
    ],
    ['sankey', '| :sankey:{"title":"sankey"} | Target | Value |\n| --- | --- | --- |\n| A | B | 3 |'],
  ] as const;

  for (const [type, source] of cases) {
    await setMarkdown(page, source);
    const node = page.locator('.cherry-table-chart');
    await expect(node.locator('.cherry-echarts-wrapper svg'), type).toBeVisible();
    await expect(node.locator('svg'), type).toContainText(type);
    await expect(page.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
  }
});

test('table chart cell undo and external revisions stay deterministic', async ({ page }) => {
  const before = '| :line:{"title":"Before"} | Jan |\n| --- | --- |\n| Sales | 1 |';
  const external = before.replace('Before', 'External');
  await setMarkdown(page, before);
  const node = page.locator('.cherry-table-chart');
  await expect(node.locator('svg')).toContainText('Before');
  const descriptor = page.locator('.milkdown-table-block th p').first();
  await descriptor.fill(':line:{"title":"输入中"}');
  expect(await markdown(page)).toContain('输入中');
  await expect(node.locator('svg')).toContainText('输入中');

  await descriptor.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toContain('Before');

  await setMarkdown(page, external);
  await expect(page.locator('.milkdown-table-block th p').first()).toContainText('External');
  await expect(page.locator('.cherry-table-chart svg')).toContainText('External');
  expect(await markdown(page)).toBe(external);
});

test('invalid Mermaid source recovers locally without leaving a stale global error', async ({ page }) => {
  await setMarkdown(page, '```mermaid\ngraph LR\n A-->B\n```');
  const node = page.locator('.cherry-embed--cherry_diagram');
  await expect(node.locator('svg')).toBeVisible();
  await node.getByRole('button', { name: '在节点内编辑源码', exact: true }).click();
  const source = node.locator('.cherry-embed__source code');
  await source.fill('invalid diagram');
  await expect(node.getByRole('alert')).toBeVisible();
  await source.fill('graph LR\n A-->C');
  await expect(node.locator('svg')).toBeVisible();
  await expect(page.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
  await expect(source).toBeFocused();
  expect(await markdown(page)).toContain('A-->C');
});

test('table chart owns its rendered resources and responds to API updates', async ({ page }) => {
  await setMarkdown(page, '| :line:{"title":"Trend"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |');
  await expect(page.locator('.cherry-echarts-wrapper svg')).toBeVisible();
  await setMarkdown(page, 'Removed');
  await expect(page.locator('.cherry-echarts-wrapper')).toHaveCount(0);
});

test('table insertion guides allow text clicks and their add buttons still create rows', async ({ page }) => {
  await setMarkdown(page, '| A | B |\n| --- | --- |\n| 1 | 2 |');
  const table = page.locator('.milkdown-table-block table.children');
  const cell = table.locator('td').first();
  await table.click();
  await cell.locator('p').click();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await expect(cell).toContainText('1 edited');
  const rect = await cell.boundingBox();
  // Stay inside the cell's padding box, not the collapsed table border.
  await cell.hover({ position: { x: rect!.width / 2, y: rect!.height - 4 } });
  const addRow = page.locator('[data-role="x-line-drag-handle"] .add-button');
  await expect(addRow).toBeVisible();
  await addRow.click();
  await expect(table.locator('tr')).toHaveCount(3);
  expect(await markdown(page)).toContain('1 edited');
});

test('native heading computed styles match without copying styles', async ({ page }) => {
  await setMarkdown(page, '# Heading\n\n- [ ] Task');
  const result = await page.evaluate(() => {
    const editor = window.milkdownEditor!;
    const native = document.createElement('div');
    native.className = 'cherry-markdown';
    native.innerHTML = editor.engine.makeHtml(editor.getMarkdown());
    const shell = document.createElement('div');
    shell.className = document.querySelector<HTMLElement>('#markdown > .cherry')!.className;
    shell.append(native);
    document.body.append(shell);
    const properties = ['color', 'fontSize', 'fontWeight', 'lineHeight'];
    const read = (element: Element) =>
      properties.map((key) =>
        getComputedStyle(element).getPropertyValue(key.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)),
      );
    const actual = read(document.querySelector('.ProseMirror h1')!);
    const expected = read(native.querySelector('h1')!);
    shell.remove();
    return { actual, expected };
  });
  expect(result.actual).toEqual(result.expected);
});

test('destroy removes the owned editor and controls', async ({ page }) => {
  await page.evaluate(() => window.milkdownEditor!.destroy());
  await expect(page.locator('.ProseMirror,.cherry-milkdown')).toHaveCount(0);
});

test('columns use every grid column for content, never for editing chrome', async ({ page }) => {
  await setMarkdown(page, '::: cols\nLeft content\n::\nRight content\n:::');
  const columns = page.locator('.cherry-panel-cols > .cherry-panel--col');
  await expect(columns).toHaveCount(2);
  const left = await columns.nth(0).boundingBox();
  const right = await columns.nth(1).boundingBox();
  expect(left).not.toBeNull();
  expect(right).not.toBeNull();
  const isStacked = Math.abs(left!.y - right!.y) >= 1;
  if (isStacked) {
    expect(right!.y).toBeGreaterThan(left!.y);
    expect(Math.abs(left!.x - right!.x)).toBeLessThan(1);
  } else {
    expect(right!.x).toBeGreaterThan(left!.x);
  }
  expect(Math.abs(left!.width - right!.width)).toBeLessThan(1);
  await expect(columns.nth(0)).toContainText('Left content');
  await expect(columns.nth(1)).toContainText('Right content');
});
