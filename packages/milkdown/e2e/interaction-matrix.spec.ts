import { expect, markdown, setMarkdown, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await expect(page.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'true');
});

const editableCases = [
  { name: 'paragraph', markdown: 'Plain text', selector: '.ProseMirror > p' },
  { name: 'heading', markdown: '## Heading', selector: '.ProseMirror > h2' },
  { name: 'quote', markdown: '> Quote', selector: '.ProseMirror > blockquote p' },
  { name: 'unordered list', markdown: '- First\n- Second', selector: '.ProseMirror li:first-child p' },
  { name: 'ordered list', markdown: '1. First\n2. Second', selector: '.ProseMirror li:first-child p' },
] as const;

for (const item of editableCases) {
  test(`focus, select, edit and delete text without shifting ${item.name}`, async ({ page }) => {
    await setMarkdown(page, item.markdown);
    const target = page.locator(item.selector).first();
    await expect(target).toBeVisible();
    const before = await target.boundingBox();

    await target.click();
    await page.keyboard.press('End');
    await page.keyboard.type('XYZ');
    await expect.poll(() => markdown(page)).toContain('XYZ');
    const edited = await target.boundingBox();
    expect(edited!.x).toBeCloseTo(before!.x, 0);
    expect(edited!.width).toBeCloseTo(before!.width, 0);

    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await expect.poll(() => markdown(page)).not.toContain('XYZ');

    await target.click({ clickCount: 3 });
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim().length ?? 0)).toBeGreaterThan(0);
    await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeVisible();
    const selected = await target.boundingBox();
    // Bubble positioning may scroll the viewport a few pixels to keep the
    // floating toolbar visible. It must not change the content geometry.
    expect(selected!.x).toBeCloseTo(before!.x, 0);
    expect(selected!.width).toBeCloseTo(before!.width, 0);
    expect(selected!.height).toBeCloseTo(before!.height, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });
}

test('task selection and toggle retain the native marker geometry', async ({ page }) => {
  await setMarkdown(page, '- [ ] Pending\n- [x] Done');
  const item = page.locator('.ProseMirror li[data-item-type="task"]').first();
  const marker = item.locator('.cherry-task-checkbox,.ch-icon').first();
  const before = await item.boundingBox();
  await marker.click();
  await expect.poll(() => markdown(page)).toContain('- [x] Pending');
  expect(await item.boundingBox()).toEqual(before);
  await marker.click();
  await expect.poll(() => markdown(page)).toContain('- [ ] Pending');
});

test('TOC links and ordinary hash links navigate to stable heading ids', async ({ page }) => {
  await setMarkdown(page, '# Start\n\n[[toc]]\n\n## Destination');
  const heading = page.locator('h2#destination');
  await expect(heading).toBeVisible();
  const tocLink = page.locator('.toc a[href="#destination"]');
  await expect(tocLink).toBeVisible();
  await tocLink.click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#destination');
  await expect(heading).toBeInViewport();

  await setMarkdown(page, '# Start\n\n[Jump](#destination)\n\n## Destination');
  await page.locator('.ProseMirror a[href="#destination"]:not(.anchor)').click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#destination');
  await expect(page.locator('h2#destination')).toBeInViewport();
});

test('Panel and Detail controls update structure without replacing native layout', async ({ page }) => {
  await setMarkdown(page, ':::warning Notice\nBody\n:::\n\n+++ More\nContent\n+++');
  const panel = page.locator('.cherry-compound.cherry-panel');
  const panelBefore = await panel.boundingBox();
  const title = panel.locator('.cherry-compound__title');
  await title.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' updated');
  await expect(title).toHaveValue('Notice updated');
  await panel.getByRole('button', { name: '切换块类型' }).click();
  await expect(panel).toHaveClass(/cherry-panel__danger/);
  expect((await panel.boundingBox())!.width).toBeCloseTo(panelBefore!.width, 0);

  const detail = page.locator('.cherry-compound.cherry-detail');
  const items = detail.locator('.cherry-compound-item--detail');
  await expect(items).toHaveCount(1);
  await detail.getByRole('button', { name: '增加项目' }).click();
  await expect(items).toHaveCount(2);
  const newItem = items.last();
  const newTitle = newItem.locator('.cherry-compound-item__label');
  await newTitle.fill('Second');
  await expect.poll(() => markdown(page)).toContain('Second');
  await newItem.getByRole('button', { name: '删除项目' }).click();
  await expect(items).toHaveCount(1);
  await expect(detail).toContainText('Content');
});

test('code block content, language and deletion stay inside one NodeView', async ({ page }) => {
  await setMarkdown(page, '```javascript\nconst value = 1;\n```');
  const block = page.locator('.cherry-milkdown-code-block');
  const content = block.locator('code');
  await content.click();
  await page.keyboard.press('End');
  await page.keyboard.type('\nconst next = 2;');
  await expect.poll(() => markdown(page)).toContain('const next = 2;');
  await block.getByRole('combobox', { name: '代码语言' }).selectOption('typescript');
  await expect.poll(() => markdown(page)).toContain('```typescript');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
  await block.click({ position: { x: 2, y: 2 } });
  await expect(block).toHaveClass(/is-selected/);
  await page.keyboard.press('Backspace');
  await expect(block).toHaveCount(0);
});

test('inline and block formula edits update Markdown without opening text Bubble', async ({ page }) => {
  await setMarkdown(page, 'Inline $x$ formula.\n\n$$\ny=1\n$$');
  const inline = page.getByLabel('Inline formula');
  const inlineBox = (await inline.boundingBox())!;
  await inline.click({ position: { x: inlineBox.width - 2, y: inlineBox.height / 2 } });
  await inline.press('ControlOrMeta+ArrowRight');
  await inline.pressSequentially('+1');
  await expect.poll(() => markdown(page)).toContain('+1');
  expect(await markdown(page)).toContain('x');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();

  const block = page.getByLabel('Block formula');
  const blockBox = (await block.boundingBox())!;
  await block.click({ position: { x: blockBox.width - 2, y: blockBox.height / 2 } });
  await block.press('ControlOrMeta+ArrowRight');
  await block.pressSequentially('+2');
  await expect.poll(() => markdown(page)).toContain('+2');
  expect(await markdown(page)).toContain('y=1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});

test('Milkdown interaction cannot restyle a native Cherry sibling', async ({ page }) => {
  await setMarkdown(page, '# Heading\n\n- [ ] Task\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
  const baseline = await page.evaluate(() => {
    const native = document.createElement('div');
    native.dataset.isolationOracle = '';
    native.className = 'cherry cherry-markdown';
    native.innerHTML = window.milkdownEditor!.engine.makeHtml(window.milkdownEditor!.getMarkdown());
    document.body.append(native);
    const read = () => {
      const heading = native.querySelector('h1')!;
      const style = getComputedStyle(heading);
      return {
        html: native.innerHTML,
        color: style.color,
        fontSize: style.fontSize,
        width: heading.getBoundingClientRect().width,
        height: heading.getBoundingClientRect().height,
      };
    };
    return read();
  });

  const heading = page.locator('.ProseMirror h1');
  await heading.click({ clickCount: 3 });
  await page.getByRole('toolbar', { name: '文本格式' }).locator('[title="加粗"]').click();
  await page.locator('.ProseMirror li[data-item-type="task"] .cherry-task-checkbox,.ProseMirror li[data-item-type="task"] .ch-icon').first().click();

  const after = await page.locator('[data-isolation-oracle]').evaluate((native) => {
    const heading = native.querySelector('h1')!;
    const style = getComputedStyle(heading);
    return {
      html: native.innerHTML,
      color: style.color,
      fontSize: style.fontSize,
      width: heading.getBoundingClientRect().width,
      height: heading.getBoundingClientRect().height,
    };
  });
  expect(after).toEqual(baseline);
});

const sourceCases = [
  {
    name: 'columns',
    markdown: ':::cols\nLeft\n::\nRight\n:::',
    updated: ':::cols\nLeft updated\n::\nRight\n:::',
    root: '.cherry-embed--cherry_native_block',
    rendered: '.cherry-panel-cols',
    expected: 'Left updated',
  },
  {
    name: 'tabs',
    markdown: ':::tabs\n:: One\nFirst\n:: Two\nSecond\n:::',
    updated: ':::tabs\n:: One\nFirst updated\n:: Two\nSecond\n:::',
    root: '.cherry-embed--cherry_native_block',
    rendered: '.cherry-tabs',
    expected: 'First updated',
  },
  {
    name: 'timeline',
    markdown: ':::timeline\n:: 2025\nFirst\n:: 2026\nSecond\n:::',
    updated: ':::timeline\n:: 2025\nFirst updated\n:: 2026\nSecond\n:::',
    root: '.cherry-embed--cherry_native_block',
    rendered: '.cherry-timeline',
    expected: 'First updated',
  },
  {
    name: 'HTML',
    markdown: '<div class="html-probe">First</div>',
    updated: '<div class="html-probe">Updated</div>',
    root: '.cherry-embed--cherry_html_block',
    rendered: '.html-probe',
    expected: 'Updated',
  },
  {
    name: 'Mermaid',
    markdown: '```mermaid\ngraph LR\nA-->B\n```',
    updated: 'graph LR\nA-->C',
    root: '.cherry-embed--cherry_diagram',
    rendered: 'svg',
    expected: 'A-->C',
  },
  {
    name: 'ECharts',
    markdown: '```echarts\n{"title":{"text":"First"},"series":[]}\n```',
    updated: '{"title":{"text":"Updated"},"series":[]}',
    root: '.cherry-embed--cherry_diagram',
    rendered: 'svg',
    expected: 'Updated',
  },
] as const;

for (const item of sourceCases) {
  test(`source-backed ${item.name} supports focus, update, close and deletion`, async ({ page }) => {
    await setMarkdown(page, item.markdown);
    const root = page.locator(item.root).first();
    await expect(root.locator(item.rendered)).toBeVisible();
    const toggle = root.getByRole('button', { name: '在节点内编辑源码', exact: true });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const source = root.locator('.cherry-embed__source code');
    await expect(source).toBeFocused();
    await source.fill(item.updated);
    await expect.poll(() => markdown(page)).toContain(item.expected);
    await expect(root.locator(item.rendered)).toBeVisible();
    await toggle.click();
    await expect(source).toBeHidden();
    expect((await root.boundingBox())!.width).toBeLessThanOrEqual(
      await page.locator('.cherry-previewer').evaluate((element) => element.clientWidth),
    );

    await root.click({ position: { x: 2, y: 2 } });
    await expect(root).toHaveClass(/is-selected/);
    await page.keyboard.press('Backspace');
    await expect(page.locator(item.root)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });
}
