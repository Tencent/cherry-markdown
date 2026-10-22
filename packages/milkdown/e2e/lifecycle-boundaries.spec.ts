import { test, expect, markdown, replaceTableCell, setMarkdown } from './fixtures';
import type { Page } from '@playwright/test';

async function placeCaretAtTextOffset(page: Page, text: string, offset: number) {
  await page.keyboard.press('ControlOrMeta+End');
  const position = () =>
    page.evaluate(() => ({
      text: window.getSelection()?.anchorNode?.nodeValue,
      offset: window.getSelection()?.anchorOffset,
    }));
  // Native End can stop in the editor-only trailing paragraph. Observe each
  // real arrow-key movement instead of assuming a fixed number of positions.
  for (let count = 0; count < text.length + 3; count += 1) {
    const current = await position();
    if (current.text === text && current.offset === offset) return;
    await page.keyboard.press('ArrowLeft');
  }
  expect(await position()).toEqual({ text, offset });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

test('theme changes refresh charts without replacing table/code chart DOM or the Mermaid source editor', async ({
  page,
}) => {
  const value =
    '# Theme\n\n| :line:{"title":"Table chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```echarts\n{animation:false,title:{text:"Code chart"},xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2],itemStyle:{color:"#c26b00"}}]}\n```\n\n```mermaid\ngraph LR\n A[One]-->B[Two]\n```';
  await setMarkdown(page, value);
  const code = page.locator('.cherry-echarts-codeblock-wrapper');
  const table = page.locator('.cherry-table-chart--derived');
  const diagram = page.locator('.cherry-embed[data-type="mermaid"]');
  const title = code.locator('svg text').filter({ hasText: 'Code chart' });
  await expect(title).toBeVisible();
  await expect(diagram.locator('svg')).toBeVisible();
  const lightTitle = await title.getAttribute('fill');
  const businessColor = code.locator('[fill="#c26b00"], [stroke="#c26b00"]');
  expect(await businessColor.count()).toBeGreaterThan(0);
  const lightStroke = await diagram
    .locator('.node rect')
    .first()
    .evaluate((el) => getComputedStyle(el).stroke);
  const codeHandle = await code.elementHandle();
  const tableHandle = await table.elementHandle();
  await diagram.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = diagram.locator('.cherry-embed__source code');
  await source.click();
  await source.press('End');
  const before = await page.evaluate(() => ({
    node: window.getSelection()?.anchorNode?.textContent,
    offset: window.getSelection()?.anchorOffset,
  }));
  await page.evaluate(() => window.milkdownEditor!.setTheme('dark'));
  await expect.poll(() => title.getAttribute('fill')).not.toBe(lightTitle);
  await expect
    .poll(() =>
      diagram
        .locator('.node rect')
        .first()
        .evaluate((el) => getComputedStyle(el).stroke),
    )
    .not.toBe(lightStroke);
  await expect(source).toBeFocused();
  expect(
    await page.evaluate(() => ({
      node: window.getSelection()?.anchorNode?.textContent,
      offset: window.getSelection()?.anchorOffset,
    })),
  ).toEqual(before);
  expect(await codeHandle!.evaluate((el) => el.isConnected)).toBe(true);
  expect(await tableHandle!.evaluate((el) => el.isConnected)).toBe(true);
  expect(await markdown(page)).toBe(value);
  expect(await businessColor.count()).toBeGreaterThan(0);
  await page.evaluate(() => window.milkdownEditor!.setTheme('default'));
  await expect.poll(() => title.getAttribute('fill')).toBe(lightTitle);
  await expect
    .poll(() =>
      diagram
        .locator('.node rect')
        .first()
        .evaluate((el) => getComputedStyle(el).stroke),
    )
    .toBe(lightStroke);
  await expect(source).toBeFocused();
  expect(await markdown(page)).toBe(value);
});

test('export rebuilds preserve chart content, editing and deletion for both chart kinds', async ({ page }) => {
  const codeSource =
    '{animation:false,title:{text:"Code chart"},xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2]}]}';
  await setMarkdown(
    page,
    '| :line:{"title":"Table chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n' +
      `\`\`\`echarts\n${codeSource}\n\`\`\``,
  );
  const table = page.locator('.cherry-table-chart');
  const code = page.locator('.cherry-embed--cherry_diagram:not([data-type="mermaid"])');
  await expect(table.locator('svg')).toContainText('Table chart');
  await expect(code.locator('svg')).toContainText('Code chart');
  for (let revision = 0; revision < 3; revision += 1) {
    await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
    await expect(table.locator('svg')).toContainText('Table chart');
    await expect(code.locator('svg')).toContainText('Code chart');
  }

  await replaceTableCell(page, page.locator('.milkdown-table-block td p').nth(1), '7');
  await expect(table.locator('.cherry-echarts-wrapper')).toHaveAttribute('data-table-data', /"Sales","7","2"/);
  await code.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = code.locator('.cherry-embed__source code');
  await source.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(codeSource.replace('Code chart', 'Code updated'));
  await expect(code.locator('svg')).toContainText('Code updated');
  await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
  await expect(code.locator('svg')).toContainText('Code updated');
  await expect(table.locator('.cherry-echarts-wrapper')).toHaveAttribute('data-table-data', /"Sales","7","2"/);

  await setMarkdown(page, '| :line:{"title":"Table chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 7 | 2 |');
  await expect(code).toHaveCount(0);
  await expect(table.locator('svg')).toContainText('Table chart');
  await replaceTableCell(page, page.locator('.milkdown-table-block td p').nth(1), '9');
  await expect(table.locator('.cherry-echarts-wrapper')).toHaveAttribute('data-table-data', /"Sales","9","2"/);
  await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
  await expect(table.locator('svg')).toContainText('Table chart');

  await setMarkdown(page, 'Charts removed');
  await expect(page.locator('.cherry-echarts-wrapper')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
  await expect(page.locator('.cherry-echarts-wrapper')).toHaveCount(0);
  expect(await markdown(page)).toBe('Charts removed');
});

test('native Chromium composition commits Chinese without duplicate text and supports undo', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME pipeline is exercised through its native input protocol.');
  await setMarkdown(page, 'Start');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('ControlOrMeta+End');
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toContainText('nihao');
  await input.send('Input.insertText', { text: '你好' });
  await expect(paragraph).toHaveText('Start你好');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Start你好');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph).toHaveText('Start');
  await input.detach();
});

test('coalesces an external change before the composing range without discarding committed input', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME pipeline is exercised through its native input protocol.');
  await setMarkdown(page, 'Start');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('ControlOrMeta+End');
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
  await expect(paragraph).toHaveText('Startni');
  await page.evaluate(() => {
    window.milkdownEditor!.setMarkdown('Remote obsolete', { emit: false });
    window.milkdownEditor!.setMarkdown('Remote final', { emit: false });
  });
  await expect(paragraph).toHaveText('Startni');
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toHaveText('Startnihao');
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Remote final你好');
  await expect(paragraph).toHaveText('Remote final你好');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe('Remote final你好'.length);
  await input.detach();
});

test('an external prepend received before the first preedit mutation preserves committed input and its caret', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol; OS candidate selection is verified separately.');
  await setMarkdown(page, '开始：结束');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await placeCaretAtTextOffset(page, '开始：结束', 3);
  await page.evaluate(() => {
    document
      .querySelector('.ProseMirror')!
      .addEventListener(
        'compositionupdate',
        () =>
          queueMicrotask(() =>
            window.milkdownEditor!.setMarkdown(`远程前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false }),
          ),
        { capture: true, once: true },
      );
  });
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toHaveText('开始：nihao结束');
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好结束');
  expect(
    await page.evaluate(() => ({
      text: window.getSelection()?.anchorNode?.textContent,
      offset: window.getSelection()?.anchorOffset,
    })),
  ).toEqual({ text: '开始：你好结束', offset: 5 });
  await page.keyboard.type('!');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好!结束');
  await input.detach();
});

test('an external preedit snapshot and subsequent echo preserve Chinese, caret and undo/redo', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol; OS candidate selection is verified separately.');
  await setMarkdown(page, '开始：结束');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await placeCaretAtTextOffset(page, '开始：结束', 3);
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
  await page.evaluate(() => {
    window.milkdownEditor!.setMarkdown(`旧前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false });
    window.milkdownEditor!.setMarkdown(`远程前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false });
    window.milkdownEditor!.setMarkdown(window.milkdownEditor!.getMarkdown(), { emit: false });
  });
  await expect(paragraph).toHaveText('开始：ni结束');
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(3);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
  await input.detach();
});

test('external prepend maps the live caret and subsequent typing to its original paragraph', async ({ page }) => {
  await setMarkdown(page, 'First\n\nSecond');
  const paragraph = page.locator('.ProseMirror > p').nth(1);
  await paragraph.click();
  await page.keyboard.press('End');
  await page.evaluate(() => window.milkdownEditor!.setMarkdown('Remote\n\nFirst\n\nSecond', { emit: false }));
  await page.keyboard.type(' edited');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Remote\n\nFirst\n\nSecond edited');
});

test('external prepend preserves the live paragraph when charts and a trailing Mermaid are present', async ({
  page,
}) => {
  const value =
    '# Heading\n\nFirst\n\n| :line: | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```echarts\n{animation:false,xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2]}]}\n```\n\n```mermaid\ngraph LR\n A-->B\n```';
  await setMarkdown(page, value);
  const paragraph = page.locator('.ProseMirror > p').filter({ hasText: 'First' });
  await paragraph.click();
  await page.keyboard.press('End');
  await page.evaluate((value) => window.milkdownEditor!.setMarkdown(`Remote\n\n${value}`, { emit: false }), value);
  await page.keyboard.type(' edited');
  await expect(paragraph).toHaveText('First edited');
  await expect.poll(() => markdown(page)).toContain('First edited');
  await expect(page.locator('.cherry-table-chart--derived svg')).toBeVisible();
  await expect(page.locator('.cherry-embed[data-type="mermaid"] svg')).toBeVisible();
});

test('a long mixed document supports real editing, selection, formatting, deletion and undo', async ({ page }) => {
  const sections = Array.from(
    { length: 300 },
    (_, index) =>
      `## Section ${index}\n\n${'中文长文档验收，编辑和选区必须保持稳定。'.repeat(6)}${index % 50 === 0 ? '\n\n| :line: | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```mermaid\ngraph LR\n A-->B\n```' : ''}`,
  ).join('\n\n');
  const value = `# Long document\n\n${sections}`;
  expect(value.length).toBeGreaterThan(35_000);
  await setMarkdown(page, value);
  const heading = page.locator('.ProseMirror h2').filter({ hasText: 'Section 250' });
  await heading.scrollIntoViewIfNeeded();
  await heading.click({ clickCount: 3 });
  await page.keyboard.type('Changed 250');
  await expect.poll(() => markdown(page)).toContain('## Changed 250');
  await page.locator('.ProseMirror h2').filter({ hasText: 'Changed 250' }).click({ clickCount: 3 });
  await page.getByRole('toolbar', { name: '文本格式' }).getByRole('button', { name: '加粗' }).click();
  await expect.poll(() => markdown(page)).toContain('**Changed 250**');
  await page.keyboard.press('Backspace');
  await expect.poll(() => markdown(page)).not.toContain('Changed 250');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toContain('Changed 250');
  expect(await page.locator('.ProseMirror h2').count()).toBe(300);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(
    false,
  );
});

test('controlled-value echoes never replay the intermediate composition over committed Chinese', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  await setMarkdown(page, 'Start');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('ControlOrMeta+End');
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toHaveText('Startnihao');
  await page.evaluate(() => window.milkdownEditor!.setMarkdown(window.milkdownEditor!.getMarkdown(), { emit: false }));
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Start你好');
  await expect(paragraph).toHaveText('Start你好');
  await input.detach();
});

test('source boundary shortcuts and range selection stay inside the owned source editor', async ({ page }) => {
  await setMarkdown(page, 'Before\n\n```custom-preview\nAlpha\nBeta\n```\n\nAfter');
  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+Home');
  await page.keyboard.type('X');
  await expect(source).toHaveText('XAlpha\nBeta');
  await source.press('ControlOrMeta+End');
  await page.keyboard.type('Y');
  await expect(source).toHaveText('XAlpha\nBetaY');
  await source.press('ControlOrMeta+Shift+Home');
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('XAlpha\nBetaY');
  await page.keyboard.type('Replaced');
  await expect(source).toHaveText('Replaced');
  await expect
    .poll(async () => (await markdown(page)).trimEnd())
    .toBe('Before\n\n```custom-preview\nReplaced\n```\n\nAfter');
  await expect(source).toBeFocused();
});

test('native composition inside an owned source editor persists exactly one committed Chinese value', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  await setMarkdown(page, '```custom-preview\nStart\n```');
  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+End');
  await expect(source).toBeFocused();
  expect(
    await source.evaluate((element) => {
      const selection = element.ownerDocument.getSelection();
      return Boolean(selection?.focusNode && element.contains(selection.focusNode));
    }),
  ).toBe(true);
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await input.send('Input.insertText', { text: '你好' });
  await expect(source).toHaveText('Start你好');
  await expect.poll(() => markdown(page)).toContain('Start你好');
  expect((await markdown(page)).match(/你好/g)).toHaveLength(1);
  await expect(page.locator('[data-custom-preview]')).toHaveText('Start你好');
  await expect(source).toBeFocused();
  await input.detach();
});

test('an external prepend keeps the composed source editor focused and updates its renderer', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  await setMarkdown(page, '```custom-preview\n开始：结束\n```');
  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+End');
  await source.press('ArrowLeft');
  await source.press('ArrowLeft');
  await expect(source).toBeFocused();
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(3);
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
  await page.evaluate(() =>
    window.milkdownEditor!.setMarkdown(`远程前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false }),
  );
  await input.send('Input.insertText', { text: '你好' });
  await expect
    .poll(async () => (await markdown(page)).trimEnd())
    .toBe('远程前缀\n\n```custom-preview\n开始：你好结束\n```');
  await expect(source).toHaveText('开始：你好结束');
  await expect(source).toBeFocused();
  await expect(page.locator('[data-custom-preview]')).toHaveText('开始：你好结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
  await input.detach();
});
