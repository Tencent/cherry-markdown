import { test, expect, markdown, setMarkdown } from './fixtures';
import { cherryCompatibilityCases } from '../test/fixtures/compatibility';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor), undefined, { timeout: 30_000 });
  await expect(page.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
});

test('previewOnly boot has no visible source editor, top toolbar or runtime errors', async ({ page }) => {
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
    page.locator(
      '.cherry.cherry--no-toolbar > .cherry-previewer.cherry-previewer--full.cherry-markdown.cherry-milkdown',
    ),
  ).toHaveCount(1);
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
  // A real triple-click selects the paragraph without depending on the
  // platform-specific Home/End behavior used by the Playwright browser host.
  await paragraph.click({ clickCount: 3 });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe('Selected text');
  const bubble = page.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveClass(/cherry-bubble--preview/);
  await expect(page.locator('.cherry-milkdown-bubble')).toHaveCount(0);
  expect(await paragraph.boundingBox()).toEqual(before);
  await bubble.locator('[title="加粗"]').click();
  await expect(paragraph.locator('strong')).toHaveText('Selected text');
  expect(await markdown(page)).toContain('**Selected text**');
  await expect.poll(() => page.evaluate(() => window.cherry!.getMarkdown())).toBe('**Selected text**');
  await expect(page.locator('.ProseMirror')).toBeFocused();
  // Let the Bubble click's focus restoration and immediate Cherry echo finish
  // before exercising the next user action. The echo is non-historical.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph.locator('strong')).toHaveCount(0);
});

test('Bubble follows a visible selection while scrolling and hides after it leaves the viewport', async ({ page }) => {
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
  await expect.poll(async () => (await bubble.boundingBox())?.y).toBeLessThan(before!.y - 20);
  await expect(bubble).toBeVisible();

  await scrollEditor(2_000);
  await expect(bubble).toBeHidden();
});

test('Bubble quote and color controls apply to the active text selection', async ({ page }) => {
  await setMarkdown(page, 'Bubble target');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click({ clickCount: 3 });
  const bubble = page.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();
  await bubble.locator('[title="引用"]').click();
  await expect(page.locator('.ProseMirror > blockquote')).toContainText('Bubble target');
  await expect.poll(() => markdown(page)).toContain('> Bubble target');

  await setMarkdown(page, 'Color target');
  await page.locator('.ProseMirror > p').click({ clickCount: 3 });
  const color = bubble.getByTitle('文字颜色&背景');
  await expect(color).toBeVisible();
  await color.click();
  const picker = page.locator('.cherry-color-wrap:visible');
  await expect(picker).toBeVisible();
  await picker.locator('.cherry-color-preset-item').first().click();
  await expect(page.locator('.ProseMirror .cherry-wysiwyg-color')).toContainText('Color target');
  await expect.poll(() => markdown(page)).toMatch(/!![^\s]+ Color target!!/);
});

test('edit&preview routes Bubble commands to the focused editor and synchronizes both panes', async ({ page }) => {
  await page.goto('/?mode=edit%26preview');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await expect(page.locator('.cm-editor')).toBeVisible();
  await expect(page.locator('.ProseMirror')).toBeVisible();

  await setMarkdown(page, '- [注入](https://example.com)\n- API');
  const previewLink = page.locator('.ProseMirror a').filter({ hasText: '注入' });
  const linkBox = await previewLink.boundingBox();
  expect(linkBox).not.toBeNull();
  await page.mouse.move(linkBox!.x + 2, linkBox!.y + linkBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(linkBox!.x + linkBox!.width - 2, linkBox!.y + linkBox!.height / 2, { steps: 5 });
  await page.mouse.up();
  const bubble = page.locator('.cherry-bubble--preview:visible');
  await expect(bubble).toBeVisible();
  await bubble.getByTitle('引用').click();
  await expect(page.locator('.ProseMirror blockquote')).toContainText('注入');
  await expect.poll(() => markdown(page)).toMatch(/>\s*-\s*\[注入\]\(https:\/\/example\.com\)/);
  await expect.poll(() => page.evaluate(() => window.cherry!.getMarkdown())).toBe(await markdown(page));
  await expect(page.locator('.cm-content')).toContainText('> - [注入](https://example.com)');
  expect(await markdown(page)).toMatch(/\n\n- API$/);

  await setMarkdown(page, 'Source target');
  const sourceLine = page.locator('.cm-line').filter({ hasText: 'Source target' });
  await sourceLine.click();
  await page.keyboard.press('ControlOrMeta+a');
  await expect(bubble).toBeVisible();
  await bubble.getByTitle('加粗').click();
  await expect.poll(() => page.evaluate(() => window.cherry!.getMarkdown())).toContain('**Source target**');
  await expect(page.locator('.ProseMirror strong')).toHaveText('Source target');
});

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
  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', initiallyOpen ?? 'false');

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
  await setMarkdown(page, '- [Mermaid 讲解](https://old.example/path){target=_blank}');
  const link = page.locator('.ProseMirror a').first();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  const trigger = page.getByRole('button', { name: '编辑链接' });
  await expect(dialog).toBeHidden();
  const linkBefore = await link.boundingBox();

  // A normal link is not hijacked. Its single shared trailing affordance only
  // appears on hover/focus and stays outside the ProseMirror document flow.
  await link.hover();
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveCSS('position', 'fixed');
  await expect(page.locator('.cherry-milkdown-link-trigger')).toHaveCount(1);
  const linkAfter = await link.boundingBox();
  const triggerBox = await trigger.boundingBox();
  expect(linkAfter).toEqual(linkBefore);
  expect(
    triggerBox &&
      linkAfter &&
      (triggerBox.x >= linkAfter.x + linkAfter.width + 3 ||
        triggerBox.x + triggerBox.width <= linkAfter.x - 3 ||
        triggerBox.y + triggerBox.height <= linkAfter.y ||
        triggerBox.y >= linkAfter.y + linkAfter.height),
  ).toBe(true);
  expect(triggerBox && linkAfter && triggerBox.x >= linkAfter.x + linkAfter.width + 3).toBe(true);
  // Crossing the small visual gap between the link and its overlay must not
  // tear down the trigger before the pointer can reach it.
  await trigger.hover();
  await expect(trigger).toBeVisible();

  await link.selectText();
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeVisible();
  await trigger.hover();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeHidden();
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
  await expect(dialog.getByLabel('链接显示文本')).toHaveValue('Mermaid 讲解');
  await expect(dialog.getByLabel('链接地址')).toHaveValue('https://old.example/path');

  await dialog.getByLabel('链接显示文本').fill('Mermaid 文档');
  await dialog.getByLabel('链接地址').fill('https://new.example/guide');
  await dialog.getByRole('button', { name: '保存' }).click();

  await expect(link).toHaveText('Mermaid 文档');
  await expect(link).toHaveAttribute('href', 'https://new.example/guide');
  expect(await markdown(page)).toContain('[Mermaid 文档](https://new.example/guide){target=_blank}');

  await page.keyboard.press('ControlOrMeta+k');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('链接地址')).toHaveValue('https://new.example/guide');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // When visible prose follows the link, the trigger must leave the text line
  // unobstructed instead of occupying the link's natural trailing position.
  await setMarkdown(page, 'Before [inline link](https://example.com) following prose.');
  await link.hover();
  await expect(trigger).toBeVisible();
  const inlineTriggerBox = await trigger.boundingBox();
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
    inlineTriggerBox &&
      followingTextBox &&
      (inlineTriggerBox.x + inlineTriggerBox.width <= followingTextBox.x ||
        inlineTriggerBox.x >= followingTextBox.x + followingTextBox.width ||
        inlineTriggerBox.y + inlineTriggerBox.height <= followingTextBox.y ||
        inlineTriggerBox.y >= followingTextBox.y + followingTextBox.height),
  ).toBe(true);
});

test('code typing is monotonic and cannot open text Bubble', async ({ page }, testInfo) => {
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
  await expect(page.locator('.cherry-previewer-img-size-handler')).toBeVisible();
  await expect(page.locator('.cherry-previewer-img-tool-handler')).toBeVisible();
  await expect(page.locator('.cherry-milkdown-node-controls')).toHaveCount(0);
  await toggle.click();
  await expect(page.locator('.cherry-previewer-img-size-handler')).toBeHidden();
  await expect(page.locator('.cherry-previewer-img-tool-handler')).toBeHidden();
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
  await expect(page.locator('.cherry-previewer-img-size-handler')).toBeHidden();
  await expect(page.locator('.cherry-previewer-img-tool-handler')).toBeHidden();
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
    await expect(page.getByRole('button', { name: '在节点内编辑源码', exact: true })).toBeVisible();
  });
}

test('image uses Cherry native resize and presentation controls', async ({ page }) => {
  await setMarkdown(page, '![dog#100px](assets/images/demo-dog.png)');
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await expect(page.locator('.cherry-previewer-img-size-handler')).toBeVisible();
  await expect(page.locator('.cherry-previewer-img-tool-handler')).toBeVisible();
  await expect(page.locator('.cherry-milkdown-node-controls')).toHaveCount(0);
  const handle = page.locator('.cherry-previewer-img-size-handler__points-rightMiddle');
  const box = await handle.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => markdown(page)).toMatch(/dog#1[3-9]\dpx/);
});

test('manual ECharts example renders including its final semicolon', async ({ page }) => {
  await page.getByRole('link', { name: 'echarts直接渲染', exact: true }).click();
  await expect(
    page.locator('.cherry-embed--cherry_diagram:not([data-type="mermaid"])').first().locator('svg'),
  ).toBeVisible();
  await expect(page.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
});

test('manual line table chart renders inside its Cherry-owned columns layout', async ({ page }) => {
  await page.getByRole('link', { name: '折线图', exact: true }).click();
  const heading = page.locator('h3#折线图');
  const nativeBlock = heading.locator('+ .cherry-embed--cherry_native_block');
  await expect(nativeBlock.locator('.cherry-panel-cols__2cols')).toBeVisible();
  await expect(nativeBlock.locator('.cherry-echarts-wrapper svg')).toBeVisible();
  await expect(nativeBlock.locator('.cherry-echarts-wrapper')).toHaveCount(1);
  await expect(nativeBlock.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
});

test('table chart nested in Cherry columns refreshes from the latest source', async ({ page }) => {
  const chart = ['| :line:{"title":"Before"} | Jan | Feb |', '| --- | --- | --- |', '| Sales | 1 | 2 |'].join('\n');
  const value = ['::: 2cols', 'Example', '```markdown', chart, '```', '::', 'Result', chart, ':::'].join('\n');
  await setMarkdown(page, value);
  const node = page.locator('.cherry-embed--cherry_native_block');
  await expect(node.locator('.cherry-echarts-wrapper svg')).toContainText('Before');

  await node.getByRole('button', { name: '编辑此表格图表源码', exact: true }).click();
  const source = node.locator('.cherry-embed__source code');
  await expect(source).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(chart);
  const updatedChart = chart.replace('Before', 'After').replace('| Sales | 1 | 2 |', '| Sales | 8 | 13 |');
  await page.keyboard.insertText(updatedChart);

  await expect(node.locator('.cherry-echarts-wrapper svg')).toContainText('After');
  await expect(node.locator('.cherry-table')).toContainText('13');
  await expect.poll(() => markdown(page)).toContain('After');
  expect((await markdown(page)).match(/Before/g)).toHaveLength(1);
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

test('table chart source toggles and changing type updates the rendered chart', async ({ page }) => {
  await setMarkdown(page, '| :line:{"title":"Trend"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |');
  const node = page.locator('.cherry-table-chart');
  await expect(node.locator('svg')).toBeVisible();
  const toggle = node.getByRole('button', { name: '在节点内编辑表格图表源码', exact: true });
  await expect(node.locator('.cherry-embed__controls')).toHaveText('源码');
  await expect(node.locator('.cherry-embed__type')).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  const source = node.locator('.cherry-embed__source code');
  await source.fill('| :bar:{"title":"Changed"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 3 | 4 |');
  await expect(node.locator('svg')).toContainText('Changed');
  expect(await markdown(page)).toContain('| Sales | 3 | 4 |');
  await toggle.click();
  await expect(source).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
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
  await expect(page.locator('.ProseMirror,.cherry-bubble--preview,.cherry-milkdown')).toHaveCount(0);
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
