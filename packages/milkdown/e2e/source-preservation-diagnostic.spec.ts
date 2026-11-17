import { test, expect, placeTextCaret } from './fixtures';

test('preserves reference definitions and footnotes on fresh external updates', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const cases = [
    ['reference', '[Same][ref]\n\nEdit here.\n\n[ref]: https://example.com/path\n'],
    ['footnote', 'Same.[^note]\n\nEdit here.\n\n[^note]: Footnote text.\n'],
    ['both', '[Same][ref].[^note]\n\nEdit here.\n\n[ref]: https://example.com/path\n\n[^note]: Footnote text.\n'],
    [
      'both-crlf',
      '[Same][ref].[^note]\r\n\r\nEdit here.\r\n\r\n[ref]: https://example.com/path\r\n\r\n[^note]: Footnote text.\r\n',
    ],
    [
      'heading',
      'Heading\n=======\n\n[Same][ref].[^note]\n\nEdit here.\n\n[ref]: https://example.com/path\n\n[^note]: Footnote text.\n',
    ],
    [
      'escape',
      '[Same][ref] and \\*literal\\*.[^note]\n\nEdit here.\n\n[ref]: https://example.com/path\n\n[^note]: Footnote text.\n',
    ],
    [
      'full-crlf',
      'Heading\r\n=======\r\n\r\n[Same][ref] and \\*literal\\*.[^note]\r\n\r\nEdit here.\r\n\r\n[ref]: https://example.com/path\r\n\r\n[^note]: Footnote text.\r\n',
    ],
    [
      'repeated',
      'Heading\r\n=======\r\n\r\n[Same][ref] and \\*literal\\*.[^note]\r\n\r\nSame text.\r\n\r\n[ref]: https://example.com/path\r\n\r\n[^note]: Footnote text.\r\n',
    ],
  ] as const;
  for (const [name, source] of cases) {
    await page.reload();
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const initial = await page.evaluate((value) => {
      window.uploadEditor!.setMarkdown(value, { emit: false });
      return window.uploadEditor!.getMarkdown();
    }, source);
    expect(initial, `${name}: external update`).toBe(source);
    const target = name === 'repeated' ? 'Same text.' : 'Edit here.';
    await page.locator('.ProseMirror > p').filter({ hasText: target }).click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await expect
      .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
      .toBe(source.replace(target, `${target}!`));
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  }
});

test('structural edits do not serialize a footnote layout placeholder', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source =
    'Heading\n=======\n\n[Same][ref].[^note]\n\nEdit here.\n\n[ref]: https://example.com/path\n\n[^note]: Footnote text.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'Edit here.' }).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('New paragraph');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('New paragraph');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('<br />');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('New paragraph');
  const undone = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  expect(undone).toContain('Edit here.');
  expect(undone).toContain('[^note]: Footnote text.');
  expect(undone).not.toContain('<br />');
  expect(undone).toBe(source);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('New paragraph');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('<br />');
});

test('structural undo restores CRLF and reference spelling in a footnote document', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source =
    'Heading\r\n=======\r\n\r\n[Same][ref].[^note]\r\n\r\nEdit here.\r\n\r\n[ref]: https://example.com/path\r\n\r\n[^note]: Footnote text.\r\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'Edit here.' }).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('New paragraph');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('New paragraph');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
});

test('a plugin edit appended to undo is not overwritten by historical source', async ({ page }) => {
  await page.goto('/upload-harness.html?undo-append');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source =
    'Heading\n=======\n\n[Same][ref].[^note]\n\nEdit here.\n\n[ref]: https://example.com/path\n\n[^note]: Footnote text.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'Edit here.' }).click();
  await page.keyboard.press('End');
  await page.keyboard.type('?');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Edit here.?');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Edit here.!');
  await expect(page.locator('.ProseMirror > p').filter({ hasText: 'Edit here.!' })).toHaveCount(1);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toBe(source);
});

for (const operation of ['type', 'split', 'delete'] as const) {
  test(`${operation} at a relocated footnote placeholder remains undoable`, async ({ page }) => {
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const source = 'First.[^note]\n\n[^note]: Footnote.\n\nLast paragraph.\n';
    await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
    const gap = page.locator('.ProseMirror > p').filter({ hasText: /^$/ }).first();
    await expect(gap).toBeVisible();
    await gap.click();
    if (operation === 'type') await page.keyboard.type('Added');
    if (operation === 'split') await page.keyboard.press('Enter');
    if (operation === 'delete') await page.keyboard.press('Backspace');
    const after = await page.evaluate(() => window.uploadEditor!.getMarkdown());
    const expected =
      operation === 'type'
        ? source.replace('Last paragraph.', 'Added\n\nLast paragraph.')
        : operation === 'split'
          ? source.replace('Last paragraph.', '<br />\n\nLast paragraph.')
          : source;
    expect(after).toBe(expected);
    await page.keyboard.press('ControlOrMeta+z');
    const undone = await page.evaluate(() => window.uploadEditor!.getMarkdown());
    expect(undone).toBe(source);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(expected);
  });
}

test('footnote numbering follows references through deletion, undo, and redo', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'First[^a] and second[^b].\n\n[^a]: A.\n\n[^b]: B.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  const paragraph = page.locator('.ProseMirror > p').first();
  const first = paragraph.locator('a.footnote[data-key="a"]');
  const second = paragraph.locator('a.footnote[data-key="b"]');
  const definition = page.locator('[data-type="footnote_definition"][data-label="b"] a.footnote-ref');
  await expect(second).toHaveText('[2]');
  await placeTextCaret(page, paragraph, 'First', 5);
  await page.keyboard.press('Delete');
  if (await first.count()) await page.keyboard.press('Delete');
  await expect(first).toHaveCount(0);
  await expect(second).toHaveText('[1]');
  await expect(definition).toHaveText('[1]');
  await expect(page.locator('[data-type="footnote_definition"][data-label="a"] a.footnote-ref')).not.toHaveAttribute('href');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('First[^a]');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(first).toHaveCount(1);
  await expect(second).toHaveText('[2]');
  await expect(definition).toHaveText('[2]');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(first).toHaveCount(0);
  await expect(second).toHaveText('[1]');
});

test('footnote numbering ignores literal code and matches Cherry after editing', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = '`[^fake]` and actual[^real].\n\n[^real]: Footnote.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  const reference = page.locator('.ProseMirror a.footnote[data-key="real"]');
  await expect(reference).toHaveText('[1]');
  const cherryNumber = await page.evaluate(() => {
    const rendered = document.createElement('div');
    rendered.innerHTML = window.uploadEditor!.engine.makeHtml(window.uploadEditor!.getMarkdown());
    return rendered.querySelector('a.footnote[data-key="real"]')?.textContent;
  });
  expect(cherryNumber).toBe('[1]');
  await page.locator('.ProseMirror > p').first().click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('actual[^real].!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  await expect(reference).toHaveText('[1]');
});

test('copying a relocated footnote does not copy its visual placeholder', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'First.[^note]\n\n[^note]: Footnote.\n\nLast paragraph.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'First.' }).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('First.');
  expect(copied).toContain('Last paragraph.');
  expect(copied).toContain('[^note]: Footnote.');
  expect(copied).not.toContain('<br />');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Start', { emit: false }));
  await page.locator('.ProseMirror > p').first().click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+v');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Last paragraph.');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Footnote.');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('<br />');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('Last paragraph.');
});

test('a real empty paragraph remains when a footnote placeholder is omitted', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'First.[^note]\n\n<br />\n\nLast paragraph.\n\n[^note]: Footnote.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'Last paragraph.' }).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('New paragraph');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('New paragraph');
  const actual = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  expect(actual.match(/<br\s*\/>/g)).toHaveLength(1);
  expect(actual).toContain('[^note]: Footnote.');
});

test('copying with a footnote keeps a user-created empty paragraph', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'First.[^note]\n\n<br />\n\nLast paragraph.\n\n[^note]: Footnote.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'First.' }).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.match(/<br\s*\/>/g)).toHaveLength(1);
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Start', { emit: false }));
  await page.locator('.ProseMirror > p').first().click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+v');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Last paragraph.');
  expect((await page.evaluate(() => window.uploadEditor!.getMarkdown())).match(/<br\s*\/>/g)).toHaveLength(1);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('Last paragraph.');
});

test('copying a mouse selection across a footnote gap excludes the layout placeholder', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'First.[^note]\n\n[^note]: Footnote.\n\nLast paragraph.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'First.' }).click();
  const points = await page.locator('.ProseMirror').evaluate((editor) => {
    const paragraphs = [...editor.querySelectorAll(':scope > p')];
    const first = paragraphs.find((element) => element.textContent?.startsWith('First.'))!;
    const last = paragraphs.find((element) => element.textContent?.startsWith('Last paragraph.'))!;
    const point = (element: Element, end: boolean) => {
      const range = document.createRange();
      const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode()!;
      range.setStart(text, end ? text.textContent!.length : 0);
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      return { x: rect.x, y: rect.y + rect.height / 2 };
    };
    return [point(first, false), point(last, true)];
  });
  await page.mouse.move(points[0].x + 1, points[0].y);
  await page.mouse.down();
  await page.mouse.move(points[1].x - 1, points[1].y, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toContain('Last paragraph');
  await page.keyboard.press('ControlOrMeta+c');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('First.');
  expect(copied).toContain('Last paragraph');
  expect(copied).not.toContain('<br />');
});

test('cutting and undoing a document with a footnote placeholder restores its source', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'First.[^note]\n\n[^note]: Footnote.\n\nLast paragraph.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'First.' }).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+x');
  const cut = await page.evaluate(() => navigator.clipboard.readText());
  expect(cut).toContain('First.');
  expect(cut).toContain('Last paragraph.');
  expect(cut).toContain('[^note]: Footnote.');
  expect(cut).not.toContain('<br />');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('First.');
  await page.keyboard.press('ControlOrMeta+v');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Last paragraph.');
  const pasted = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  expect(pasted).toContain('Footnote.');
  expect(pasted).not.toContain('<br />');
});

test('editing one footnote placeholder leaves other placeholders independent', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = '[^a]: First note.\n\nMiddle.\n\n[^b]: Second note.\n\nEnd.\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  const gaps = page.locator('.ProseMirror > p[data-cherry-footnote-gap]');
  await expect(gaps).toHaveCount(2);
  await gaps.first().click();
  await page.keyboard.type('Added');
  await expect(gaps).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Added');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('<br />');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(gaps).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  await page.evaluate(
    (value) => window.uploadEditor!.setMarkdown(value.replace('Middle.', 'Changed.'), { emit: false }),
    source,
  );
  await expect(gaps).toHaveCount(2);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Changed.');
});

test('external HTML cannot mark its empty paragraph as a footnote placeholder', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const results: string[] = [];
  for (const marker of [false, true]) {
    await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
    await page.evaluate(
      (marked) =>
        navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob(['A\n\n\n\nB'], { type: 'text/plain' }),
            'text/html': new Blob([`<p>A</p><p${marked ? ' data-cherry-footnote-gap=""' : ''}><br></p><p>B</p>`], {
              type: 'text/html',
            }),
          }),
        ]),
      marker,
    );
    await page.locator('.ProseMirror > p').first().click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ControlOrMeta+v');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('B');
    results.push(await page.evaluate(() => window.uploadEditor!.getMarkdown()));
  }
  expect(results[0]).toContain('<br />');
  expect(results[1]).toBe(results[0]);
});
