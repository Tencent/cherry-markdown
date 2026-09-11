import { test, expect, markdown, setMarkdown } from './fixtures';
import { cherryCompatibilityCases } from '../test/fixtures/compatibility';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
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
  expect(await page.locator('body').evaluate((body) => getComputedStyle(body).margin)).toBe('0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  await expect(
    page.locator('.cherry.cherry--no-toolbar > .cherry-previewer.cherry-previewer--full.cherry-markdown.cherry-milkdown'),
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
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph.locator('strong')).toHaveCount(0);
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
  await expect(page.locator('.cherry-embed--cherry_diagram:not([data-type="mermaid"])').first().locator('svg')).toBeVisible();
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
  expect(Math.abs(left!.y - right!.y)).toBeLessThan(1);
  expect(right!.x).toBeGreaterThan(left!.x);
  expect(Math.abs(left!.width - right!.width)).toBeLessThan(1);
  await expect(columns.nth(0)).toContainText('Left content');
  await expect(columns.nth(1)).toContainText('Right content');
});
