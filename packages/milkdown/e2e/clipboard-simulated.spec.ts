import { test, expect, markdown, setMarkdown, placeTextCaret } from './fixtures';

async function pasteRich(page: import('@playwright/test').Page, text: string, html: string) {
  await page.locator('.ProseMirror').evaluate(
    (editor, values) => {
      const data = new DataTransfer();
      data.setData('text/plain', values.text);
      data.setData('text/html', values.html);
      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      });
      // Firefox restricts the DataTransfer exposed by synthetic clipboard events.
      Object.defineProperty(event, 'clipboardData', { value: data });
      editor.dispatchEvent(event);
    },
    { text, html },
  );
}

async function placeCaretInBold(page: import('@playwright/test').Page) {
  const bold = page.locator('.ProseMirror > p strong');
  await placeTextCaret(page, bold, 'BeforeAfter', 6);
}

test('simulated clipboard paste does not alter a read-only editor', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?readonly');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const editor = page.locator('.ProseMirror');
  await expect(editor).toHaveAttribute('contenteditable', 'false');
  await editor.locator('h1').click();
  await pasteRich(page, ' Changed ', ' <strong>Changed</strong> ');
  await expect(editor.locator('h1')).toHaveText('Read-only');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('simulated rich clipboard events preserve boundary spaces and undo', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'BeforeAfter');
  const paragraph = page.locator('.ProseMirror > p').first();
  await placeTextCaret(page, paragraph, 'BeforeAfter', 6);
  await pasteRich(page, ' Bold ', ' <strong>Bold</strong> ');
  await expect(paragraph).toHaveText('Before Bold After');
  await expect(paragraph.locator('strong')).toHaveText('Bold');
  const saved = await markdown(page);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('BeforeAfter');
  await page.reload();
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, saved);
  await expect(paragraph).toHaveText('Before Bold After');
  await expect(paragraph.locator('strong')).toHaveText('Bold');
  expect(await markdown(page)).toBe(saved);
});

test('pasting unformatted text inside bold preserves the surrounding formatting', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '**BeforeAfter**');
  const bold = page.locator('.ProseMirror > p strong');
  await placeCaretInBold(page);
  await pasteRich(page, ' middle ', ' <span>middle</span> ');
  await expect(bold).toHaveText('Before middle After');
  await expect.poll(() => markdown(page)).toBe('**Before middle After**');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('**BeforeAfter**');
});

test('pasting explicitly italic text inside bold keeps the clipboard formatting', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '**BeforeAfter**');
  const paragraph = page.locator('.ProseMirror > p').first();
  await placeCaretInBold(page);
  await pasteRich(page, ' middle ', ' <em>middle</em> ');
  await expect(paragraph).toHaveText('Before middle After');
  await expect(paragraph.locator('strong')).toHaveText(['Before', 'After']);
  await expect(paragraph.locator('em')).toHaveText('middle');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('**BeforeAfter**');
});

test('keyboard positioning inside bold survives a formatted paste and undo', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '**BeforeAfter**');
  const bold = page.locator('.ProseMirror > p strong');
  await placeTextCaret(page, bold, 'BeforeAfter', 11);
  for (let count = 0; count < 5; count += 1) await page.keyboard.press('ArrowLeft');
  await expect
    .poll(() =>
      page.evaluate(() => ({
        text: window.getSelection()?.anchorNode?.textContent,
        offset: window.getSelection()?.anchorOffset,
        active: document.activeElement?.className,
      })),
    )
    .toMatchObject({ text: 'BeforeAfter', offset: 6 });
  await pasteRich(page, ' middle ', ' <span>middle</span> ');
  await expect(bold).toHaveText('Before middle After');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('**BeforeAfter**');
});

test('line-end shortcut moves the caret after refocusing bold text', async ({ page }, info) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '**BeforeAfter**');
  await page.evaluate(() => {
    const state = window as Window & { lineEndTrace?: unknown[] };
    state.lineEndTrace = [];
    for (const type of ['pointerdown', 'pointerup', 'keydown', 'keyup', 'selectionchange']) {
      document.addEventListener(type, (event) => {
        const selection = window.getSelection();
        state.lineEndTrace!.push({
          type,
          key: (event as KeyboardEvent).key,
          prevented: event.defaultPrevented,
          text: selection?.anchorNode?.textContent,
          offset: selection?.anchorOffset,
          active: document.activeElement?.className,
        });
      });
    }
  });
  await page.locator('.ProseMirror > p strong').click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End');
  try {
    await expect
      .poll(() =>
        page.evaluate(() => ({
          text: window.getSelection()?.anchorNode?.textContent,
          offset: window.getSelection()?.anchorOffset,
        })),
      )
      .toEqual({ text: 'BeforeAfter', offset: 11 });
  } catch (error) {
    await info.attach('line-end-diagnostics', {
      body: JSON.stringify(
        await page.evaluate(() => (window as Window & { lineEndTrace?: unknown[] }).lineEndTrace),
        null,
        2,
      ),
      contentType: 'application/json',
    });
    await info.attach('caret-sync-diagnostics', {
      body: JSON.stringify(
        await page.evaluate(() => (globalThis as typeof globalThis & { __caretTrace?: unknown[] }).__caretTrace ?? []),
        null,
        2,
      ),
      contentType: 'application/json',
    });
    throw error;
  }
});

test('line-end shortcut matches a native editable paragraph', async ({ page }, info) => {
  test.skip(
    process.env.MILKDOWN_SELECTION_DIAGNOSTICS !== '1',
    'Opt-in comparison for the intermittent WebKit shortcut issue.',
  );
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '**BeforeAfter**');
  const bold = page.locator('.ProseMirror > p strong').first();
  await bold.evaluate((element) => {
    const original = element.closest('.ProseMirror')!;
    const wrapper = original.closest('.cherry-milkdown')!;
    const native = wrapper.cloneNode(false) as HTMLElement;
    native.id = 'native-shortcut-comparison';
    native.append(original.cloneNode(true));
    document.body.append(native);
  });
  const results = [];
  await page.evaluate(() => {
    const state = window as Window & { shortcutTrace?: unknown[] };
    for (const type of ['keydown', 'keyup'])
      document.addEventListener(type, (event) => {
        const selection = window.getSelection();
        state.shortcutTrace?.push({
          type,
          key: (event as KeyboardEvent).key,
          prevented: event.defaultPrevented,
          text: selection?.anchorNode?.textContent,
          offset: selection?.anchorOffset,
        });
      });
  });
  for (const target of [bold, page.locator('#native-shortcut-comparison strong')]) {
    await target.scrollIntoViewIfNeeded();
    await page.evaluate(() => ((window as Window & { shortcutTrace?: unknown[] }).shortcutTrace = []));
    await target.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End');
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    results.push(
      await page.evaluate(() => ({
        text: window.getSelection()?.anchorNode?.textContent,
        offset: window.getSelection()?.anchorOffset,
        events: (window as Window & { shortcutTrace?: unknown[] }).shortcutTrace,
        caretSync: (globalThis as typeof globalThis & { __caretTrace?: unknown[] }).__caretTrace,
      })),
    );
  }
  await info.attach('native-shortcut-comparison', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  expect(results.map(({ text, offset }) => ({ text, offset }))).toEqual([
    { text: 'BeforeAfter', offset: 11 },
    { text: 'BeforeAfter', offset: 11 },
  ]);
});

test('real clipboard paste immediately follows keyboard positioning inside bold', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '**BeforeAfter**');
  await page.evaluate(() => navigator.clipboard.writeText(' middle '));
  await page.evaluate(() => {
    document.addEventListener(
      'paste',
      () => {
        const selection = window.getSelection();
        (window as Window & { pasteProbe?: unknown }).pasteProbe = {
          text: selection?.anchorNode?.textContent,
          offset: selection?.anchorOffset,
          focusText: selection?.focusNode?.textContent,
          focusOffset: selection?.focusOffset,
          active: document.activeElement?.className,
        };
      },
      { capture: true, once: true },
    );
  });
  const bold = page.locator('.ProseMirror > p strong');
  await placeTextCaret(page, bold, 'BeforeAfter', 11);
  for (let count = 0; count < 5; count += 1) await page.keyboard.press('ArrowLeft');
  await expect
    .poll(() =>
      page.evaluate(() => ({
        text: window.getSelection()?.anchorNode?.textContent,
        offset: window.getSelection()?.anchorOffset,
      })),
    )
    .toEqual({ text: 'BeforeAfter', offset: 6 });
  await page.keyboard.press('ControlOrMeta+v');
  await expect(
    bold,
    JSON.stringify(await page.evaluate(() => (window as Window & { pasteProbe?: unknown }).pasteProbe)),
  ).toHaveText('Before middle After');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('**BeforeAfter**');
});

test('real Markdown clipboard paste preserves inline formatting and boundary spaces', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'BeforeAfter');
  await page.evaluate(() => navigator.clipboard.writeText(' **bold** '));
  const paragraph = page.locator('.ProseMirror > p').first();
  await placeTextCaret(page, paragraph, 'BeforeAfter', 6);
  await page.keyboard.press('ControlOrMeta+v');
  await expect(paragraph).toHaveText('Before bold After');
  await expect(paragraph.locator('strong')).toHaveText('bold');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('BeforeAfter');
});

test('real HTML paste rejects invalid clipboard context attributes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'before');
  await page.evaluate(async () => {
    const paragraph = document.createElement('p');
    paragraph.setAttribute('data-pm-slice', `0 0 ${JSON.stringify(['heading', { level: ['unexpected'] }])}`);
    paragraph.textContent = 'safe text';
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob(['safe text'], { type: 'text/plain' }),
        'text/html': new Blob([paragraph.outerHTML], { type: 'text/html' }),
      }),
    ]);
  });
  const paragraph = page.locator('.ProseMirror > p').first();
  await placeTextCaret(page, paragraph, 'before', 6);
  await page.keyboard.press('ControlOrMeta+v');
  await expect(paragraph).toHaveText('beforesafe text');
  await expect(page.locator('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3')).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('before');
});

for (const format of ['plain', 'html'] as const)
  for (const selectionMethod of [
    'dom',
    'dom-settled',
    'keyboard',
    'keyboard-settled',
    'keyboard-paced',
    'mouse',
  ] as const)
    test(`real ${format} clipboard paste preserves spaces across paragraphs with ${selectionMethod} selection`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto('/');
      await page.waitForFunction(() => Boolean(window.milkdownEditor));
      await setMarkdown(page, 'BeforeXXX\n\nYYYAfter');
      await page.evaluate(
        (format) =>
          format === 'plain'
            ? navigator.clipboard.writeText(' middle ')
            : navigator.clipboard.write([
                new ClipboardItem({
                  'text/plain': new Blob([' middle '], { type: 'text/plain' }),
                  'text/html': new Blob([' <em>middle</em> '], { type: 'text/html' }),
                }),
              ]),
        format,
      );
      const editor = page.locator('.ProseMirror');
      if (selectionMethod.startsWith('keyboard')) {
        if (process.env.MILKDOWN_SELECTION_DIAGNOSTICS === '1') {
          await page.evaluate(() => {
            const trace: unknown[] = [];
            (window as Window & { crossPasteTrace?: unknown[] }).crossPasteTrace = trace;
            for (const name of ['keydown', 'keyup', 'selectionchange', 'focusin', 'focusout', 'milkdown-focus-probe']) {
              document.addEventListener(
                name,
                (event) => {
                  const selection = window.getSelection();
                  trace.push({
                    time: performance.now(),
                    event: name,
                    key: event instanceof KeyboardEvent ? event.key : undefined,
                    detail: event instanceof CustomEvent ? event.detail : undefined,
                    text: selection?.toString(),
                    anchor: selection?.anchorNode?.textContent,
                    anchorOffset: selection?.anchorOffset,
                    focus: selection?.focusNode?.textContent,
                    focusOffset: selection?.focusOffset,
                  });
                },
                true,
              );
            }
          });
        }
      }
      await editor.locator('p').first().click();
      if (selectionMethod === 'keyboard-settled') await page.waitForTimeout(100);
      if (selectionMethod === 'dom-settled') {
        await page.evaluate(
          () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
        );
      }
      if (selectionMethod.startsWith('keyboard')) {
        await page.keyboard.press('Home');
        for (let index = 0; index < 6; index++) {
          if (selectionMethod === 'keyboard-paced') await page.waitForTimeout(35);
          await page.keyboard.press('ArrowRight');
        }
        for (let index = 0; index < 7; index++) {
          if (selectionMethod === 'keyboard-paced') await page.waitForTimeout(35);
          await page.keyboard.press('Shift+ArrowRight');
        }
        try {
          await expect
            .poll(() => page.evaluate(() => window.getSelection()?.toString().replace(/\s/g, '')))
            .toBe('XXXYYY');
        } catch (error) {
          if (process.env.MILKDOWN_SELECTION_DIAGNOSTICS === '1')
            console.log(
              'KEYBOARD_SELECTION_TRACE',
              JSON.stringify(
                await page.evaluate(() => (window as Window & { crossPasteTrace?: unknown }).crossPasteTrace),
              ),
            );
          throw error;
        }
      } else if (selectionMethod === 'mouse') {
        const points = await editor.evaluate((element) => {
          const paragraphs = element.querySelectorAll('p');
          const point = (paragraph: Element, offset: number) => {
            const range = document.createRange();
            const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
            const text = walker.nextNode();
            if (!text) throw new Error('Missing paragraph text');
            range.setStart(text, offset);
            range.collapse(true);
            const rect = range.getBoundingClientRect();
            return { x: rect.x, y: rect.y + rect.height / 2 };
          };
          return [point(paragraphs[0], 6), point(paragraphs[1], 3)];
        });
        await page.mouse.move(points[0].x, points[0].y);
        await page.mouse.down();
        await page.mouse.move(points[1].x, points[1].y, { steps: 10 });
        await page.mouse.up();
        await expect
          .poll(() => page.evaluate(() => window.getSelection()?.toString().replace(/\s/g, '')))
          .toBe('XXXYYY');
      } else
        await editor.evaluate((element) => {
          const paragraphs = element.querySelectorAll('p');
          const range = document.createRange();
          const findText = (parent: Element) => {
            const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
            while (walker.nextNode())
              if (walker.currentNode.textContent?.includes('XXX') || walker.currentNode.textContent?.includes('YYY'))
                return walker.currentNode;
            throw new Error('Missing paragraph text');
          };
          range.setStart(findText(paragraphs[0]), 6);
          range.setEnd(findText(paragraphs[1]), 3);
          const selection = window.getSelection()!;
          const trace: unknown[] = [];
          (window as Window & { crossPasteTrace?: typeof trace }).crossPasteTrace = trace;
          for (const name of ['selectionchange', 'keydown', 'paste', 'milkdown-focus-probe']) {
            document.addEventListener(
              name,
              (event) =>
                trace.push({
                  time: performance.now(),
                  event: name,
                  selection: selection.toString(),
                  detail: event instanceof CustomEvent ? event.detail : undefined,
                }),
              true,
            );
          }
          selection.removeAllRanges();
          selection.addRange(range);
          trace.push({
            time: performance.now(),
            event: 'set-selection',
            selection: selection.toString(),
          });
        });
      await page.keyboard.press('ControlOrMeta+v');
      try {
        await expect(editor.locator('p')).toHaveCount(1);
      } catch (error) {
        if (selectionMethod === 'dom' || selectionMethod === 'dom-settled') {
          console.log(
            'CROSS_PASTE_TRACE',
            JSON.stringify(
              await page.evaluate(() => (window as Window & { crossPasteTrace?: unknown }).crossPasteTrace),
            ),
          );
        }
        throw error;
      }
      await expect(editor.locator('p')).toHaveText('Before middle After');
      if (format === 'html') await expect(editor.locator('p em')).toHaveText('middle');
      await page.keyboard.press('ControlOrMeta+z');
      await expect.poll(() => markdown(page)).toBe('BeforeXXX\n\nYYYAfter');
    });

for (const format of ['plain', 'html'] as const)
  test(`real ${format} paste has a separate undo step after typing`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await setMarkdown(page, '**BeforeAfter**');
    await page.evaluate(
      (format) =>
        format === 'plain'
          ? navigator.clipboard.writeText(' middle ')
          : navigator.clipboard.write([
              new ClipboardItem({
                'text/plain': new Blob([' middle '], { type: 'text/plain' }),
                'text/html': new Blob([' <span>middle</span> '], { type: 'text/html' }),
              }),
            ]),
      format,
    );
    const bold = page.locator('.ProseMirror > p strong');
    await placeTextCaret(page, bold, 'BeforeAfter', 6);
    await page.keyboard.type('X');
    await page.keyboard.press('ControlOrMeta+v');
    await expect(bold).toHaveText('BeforeX middle After');
    await page.keyboard.type('Y');
    await expect(bold).toHaveText('BeforeX middle YAfter');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(bold).toHaveText('BeforeX middle After');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(bold).toHaveText('BeforeXAfter');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(bold).toHaveText('BeforeAfter');
  });

test('simulated paste in a code block uses plain text and remains undoable', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '```js\nBeforeAfter\n```');
  const code = page.locator('.ProseMirror pre code').first();
  await code.click();
  await page.keyboard.press('End');
  for (let count = 0; count < 5; count += 1) await page.keyboard.press('ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(6);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await pasteRich(page, ' Bold ', ' <strong>Other</strong> ');
  await expect(code).toHaveText('Before Bold After');
  await expect(code.locator('strong')).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(code).toHaveText('BeforeAfter');
});

test('simulated paste with different HTML and plain text follows the HTML content', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'BeforeAfter');
  const paragraph = page.locator('.ProseMirror > p').first();
  await placeTextCaret(page, paragraph, 'BeforeAfter', 6);
  await pasteRich(page, ' Different ', '<strong>Bold</strong>');
  await expect(paragraph).toHaveText('BeforeBoldAfter');
  await expect(paragraph.locator('strong')).toHaveText('Bold');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('BeforeAfter');
});

test('simulated paste while Shift is held uses plain text and supports undo', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'BeforeAfter');
  const paragraph = page.locator('.ProseMirror > p').first();
  await placeTextCaret(page, paragraph, 'BeforeAfter', 6);
  await page.keyboard.down('Shift');
  try {
    await pasteRich(page, ' Bold ', ' <strong>Bold</strong> ');
  } finally {
    await page.keyboard.up('Shift');
  }
  await expect(paragraph).toHaveText('Before Bold After');
  await expect(paragraph.locator('strong')).toHaveCount(0);
  await expect.poll(() => markdown(page)).toBe('Before Bold After');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('BeforeAfter');
});

test('simulated paste over multiple paragraphs preserves the native undo boundary', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'Before\n\nAfter');
  await page.locator('.ProseMirror > p').first().click();
  await page.keyboard.press('ControlOrMeta+a');
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString().replace(/\s/g, '')))
    .toBe('BeforeAfter');
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await pasteRich(page, ' Bold ', ' <strong>Bold</strong> ');
  await expect(page.locator('.ProseMirror > p').first()).toHaveText('Bold');
  await expect(page.locator('.ProseMirror strong')).toHaveText('Bold');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('Before\n\nAfter');
});

for (const terminal of ['', '\n', '\n\n']) {
  test(`simulated table paste at document end preserves ${terminal.length} terminal newlines through undo and redo`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = `Before\n\nAfter${terminal}`;
    await setMarkdown(page, original);
    const paragraph = page.locator('.ProseMirror > p').filter({ hasText: 'After' });
    await placeTextCaret(page, paragraph, 'After', 5);
    await pasteRich(
      page,
      'A\tB\n1\t2',
      '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
    );
    const table = page.locator('.ProseMirror').getByRole('table');
    await expect(table).toHaveCount(1);
    const pasted = await markdown(page);
    if (!terminal) expect(pasted.endsWith('\n')).toBe(false);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => markdown(page)).toBe(pasted);
  });
}
