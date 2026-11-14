import { test, expect, markdown, setMarkdown, placeTextCaret } from './fixtures';

test('read-only content can be copied but cannot be changed by a clipboard paste', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?readonly');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const editor = page.locator('.ProseMirror');
  await expect(editor).toHaveAttribute('contenteditable', 'false');
  await editor.locator('h1').click({ clickCount: 3 });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe('Read-only');
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Read-only');
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([' Changed '], { type: 'text/plain' }),
        'text/html': new Blob([' <strong>Changed</strong> '], { type: 'text/html' }),
      }),
    ]);
  });
  await editor.locator('h1').click();
  await page.keyboard.press('ControlOrMeta+v');
  await expect(editor.locator('h1')).toHaveText('Read-only');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await expect(editor.getByRole('table')).toHaveCount(1);
});

for (const edge of ['leading', 'trailing'] as const) {
  test(`pasting formatted clipboard content preserves the ${edge} space and supports undo`, async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await setMarkdown(page, 'Left right');
    await page.evaluate(async (edge) => {
      const text = edge === 'leading' ? ' Bold link' : 'Bold link ';
      const html = `${edge === 'leading' ? ' ' : ''}<strong>Bold</strong> <a href="https://example.com/">link</a>${edge === 'trailing' ? ' ' : ''}`;
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], {
            type: 'text/html',
          }),
        }),
      ]);
    }, edge);
    const paragraph = page.locator('.ProseMirror > p').first();
    await placeTextCaret(page, paragraph, 'Left right', edge === 'leading' ? 4 : 5);
    await page.keyboard.press('ControlOrMeta+v');
    await expect(paragraph).toHaveText('Left Bold link right');
    await expect(paragraph.locator('strong')).toHaveText('Bold');
    await expect(paragraph.locator('a')).toHaveAttribute('href', 'https://example.com/');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(paragraph).toHaveText('Left right');
    await expect.poll(() => markdown(page)).toBe('Left right');
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(paragraph).toHaveText('Left Bold link right');
    await expect(paragraph.locator('strong')).toHaveText('Bold');
    await expect(paragraph.locator('a')).toHaveAttribute('href', 'https://example.com/');
    const saved = await markdown(page);
    await setMarkdown(page, 'Temporary replacement');
    await setMarkdown(page, saved);
    await expect(paragraph).toHaveText('Left Bold link right');
    await expect(paragraph.locator('strong')).toHaveText('Bold');
    await expect(paragraph.locator('a')).toHaveAttribute('href', 'https://example.com/');
    expect(await markdown(page)).toBe(saved);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await setMarkdown(page, saved);
    await expect(paragraph).toHaveText('Left Bold link right');
    await expect(paragraph.locator('strong')).toHaveText('Bold');
    await expect(paragraph.locator('a')).toHaveAttribute('href', 'https://example.com/');
    expect(await markdown(page)).toBe(saved);
  });
}

test('copying and pasting formatted content within the editor retains the copied space', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'Start **Bold** end\n\nTarget');
  const paragraphs = page.locator('.ProseMirror > p');
  await paragraphs.first().click();
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await paragraphs.first().evaluate((element) => {
    const bold = element.querySelector('strong')?.firstChild;
    const following = element.querySelector('strong')?.nextSibling;
    if (!bold || !following || following.nodeType !== Node.TEXT_NODE || !following.textContent?.startsWith(' ')) {
      throw new Error('Missing formatted text or its following space');
    }
    const range = document.createRange();
    range.setStart(bold, 0);
    range.setEnd(following, 1);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('Bold ');
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.keyboard.press('ControlOrMeta+c');
  await placeTextCaret(page, paragraphs.last(), 'Target', 6);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.keyboard.press('ControlOrMeta+v');
  await expect(paragraphs.last()).toHaveText('TargetBold ');
  await expect(paragraphs.last().locator('strong')).toHaveText('Bold');
  await page.keyboard.type('next');
  await expect(paragraphs.last()).toHaveText('TargetBold next');
  await expect(paragraphs.first()).toHaveText('Start Bold end');
  await page.keyboard.press('ControlOrMeta+z');
  let undoSteps = 1;
  if ((await paragraphs.last().textContent()) !== 'Target') {
    await expect(paragraphs.last()).toHaveText('TargetBold ');
    await page.keyboard.press('ControlOrMeta+z');
    undoSteps += 1;
  }
  await expect.poll(() => markdown(page)).toBe('Start **Bold** end\n\nTarget');
  for (let count = 0; count < undoSteps; count += 1) await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(paragraphs.last()).toHaveText('TargetBold next');
  await expect(paragraphs.last().locator('strong')).toHaveText('Bold');
});

test('pasting unformatted clipboard text inside bold retains bold and undo', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '**BeforeAfter**');
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([' middle '], { type: 'text/plain' }),
        'text/html': new Blob([' <span>middle</span> '], { type: 'text/html' }),
      }),
    ]);
  });
  const bold = page.locator('.ProseMirror > p strong');
  await bold.click();
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await bold.evaluate((element) => {
    const text = element.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) throw new Error('Missing bold text');
    const range = document.createRange();
    range.setStart(text, 6);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(6);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.keyboard.press('ControlOrMeta+v');
  await expect(bold).toHaveText('Before middle After');
  await expect.poll(() => markdown(page)).toBe('**Before middle After**');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('**BeforeAfter**');
});

test('pasting a formatted table keeps neighboring paragraphs and supports undo', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'Before\n\nAfter');
  expect(await markdown(page)).toBe('Before\n\nAfter');
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob(['A\tB\n1\t2'], { type: 'text/plain' }),
        'text/html': new Blob(
          ['<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'],
          { type: 'text/html' },
        ),
      }),
    ]);
  });
  const after = page.locator('.ProseMirror > p').filter({ hasText: 'After' });
  await placeTextCaret(page, after, 'After', 0);
  await page.keyboard.press('ControlOrMeta+v');
  const editor = page.locator('.ProseMirror');
  const table = editor.getByRole('table');
  await expect(table).toHaveCount(1);
  await expect(table.getByRole('columnheader')).toHaveText(['A', 'B']);
  await expect(table.getByRole('cell')).toHaveText(['1', '2']);
  expect(
    await table.evaluate((element) => {
      const after = Array.from(document.querySelectorAll('.ProseMirror > p')).find((p) => p.textContent === 'After');
      return Boolean(after && element.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING);
    }),
  ).toBe(true);
  await expect(editor).toContainText('Before');
  await expect(editor).toContainText('After');
  await test.info().attach('markdown-after-paste', { body: await markdown(page), contentType: 'text/markdown' });
  await page.keyboard.press('ControlOrMeta+z');
  await expect(editor.getByRole('table')).toHaveCount(0);
  await expect.poll(() => markdown(page)).toBe('Before\n\nAfter');
});

for (const terminal of ['', '\n', '\n\n']) {
  test(`pasting a table at the document end preserves ${terminal.length} terminal newlines on undo`, async ({
    page,
  }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = `Before\n\nAfter${terminal}`;
    await setMarkdown(page, original);
    await page.evaluate(async () => {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob(['A\tB\n1\t2'], { type: 'text/plain' }),
          'text/html': new Blob(
            ['<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'],
            { type: 'text/html' },
          ),
        }),
      ]);
    });
    const after = page.locator('.ProseMirror > p').filter({ hasText: 'After' });
    await placeTextCaret(page, after, 'After', 5);
    await page.keyboard.press('ControlOrMeta+v');
    const table = page.locator('.ProseMirror').getByRole('table');
    await expect(table).toHaveCount(1);
    expect(
      await after.evaluate((paragraph) =>
        Boolean(
          paragraph.compareDocumentPosition(document.querySelector('.ProseMirror table')!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
    ).toBe(true);
    await test.info().attach('markdown-after-end-paste', { body: await markdown(page), contentType: 'text/markdown' });
    const pasted = await markdown(page);
    if (!terminal) expect(pasted.endsWith('\n')).toBe(false);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(table).toHaveCount(0);
    await expect.poll(() => markdown(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(table).toHaveCount(1);
    await expect.poll(() => markdown(page)).toBe(pasted);
  });
}

for (const terminal of ['', '\n', '\n\n']) {
  test(`new paragraph undo and redo preserve ${terminal.length} original terminal newlines`, async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = `Text${terminal}`;
    await setMarkdown(page, original);
    await placeTextCaret(page, page.locator('.ProseMirror > p').first(), 'Text', 4);
    await page.keyboard.press('Enter');
    await page.keyboard.type('Next');
    await expect(page.locator('.ProseMirror > p').filter({ hasText: 'Next' })).toHaveCount(1);
    const edited = await markdown(page);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => markdown(page)).toBe(edited);
  });
}
