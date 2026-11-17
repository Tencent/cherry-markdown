import { expect, markdown, setMarkdown, test } from './fixtures';

test('editing repeated panel paragraphs changes only the selected source and supports undo', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  const original = ':::warning Notice\nSame text\n\nSame text\n:::';
  await setMarkdown(page, original);
  const paragraphs = page.locator('.cherry-panel--body p');
  await expect(paragraphs).toHaveCount(2);
  await paragraphs.nth(1).click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect(paragraphs.nth(0)).toHaveText('Same text');
  await expect(paragraphs.nth(1)).toHaveText('Same text!');
  await expect.poll(() => markdown(page)).toBe(':::warning Notice\nSame text\n\nSame text!\n:::');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(original);
});

test('editing repeated text in a panel leaves surrounding paragraphs and code unchanged', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  const original = 'Same text\n\n```text\nSame text\n```\n\n:::warning Notice\nSame text\n\nSame text\n:::\n\nSame text';
  const expected = original.replace('Same text\n:::', 'Same text!\n:::');
  await setMarkdown(page, original);
  const paragraphs = page.locator('.cherry-panel--body p');
  await expect(paragraphs).toHaveCount(2);
  await paragraphs.nth(1).click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect(paragraphs.nth(0)).toHaveText('Same text');
  await expect(paragraphs.nth(1)).toHaveText('Same text!');
  await expect.poll(() => markdown(page)).toBe(expected);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(original);
});

test('backward drag selection matches a native editable paragraph', async ({ page }, info) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, ':::warning Notice\nPanel body selection\n:::');
  const paragraph = page.locator('.cherry-panel--body p');
  await expect(paragraph).toHaveText('Panel body selection');
  await paragraph.evaluate((element) => {
    const native = document.createElement('div');
    native.contentEditable = 'true';
    native.id = 'native-selection-comparison';
    const cloned = element.cloneNode(true) as HTMLElement;
    const style = getComputedStyle(element);
    cloned.style.font = style.font;
    cloned.style.lineHeight = style.lineHeight;
    native.append(cloned);
    document.body.append(native);
  });
  const native = page.locator('#native-selection-comparison p');
  const results = [];
  for (const target of [paragraph, native]) {
    await target.scrollIntoViewIfNeeded();
    const bounds = await target.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        y: (rect.top + rect.bottom) / 2,
        font: getComputedStyle(element).font,
      };
    });
    await page.evaluate(() => {
      const state = window as Window & { pointerUpSelection?: unknown };
      state.pointerUpSelection = undefined;
      document.addEventListener(
        'pointerup',
        (event) => {
          const selection = window.getSelection();
          state.pointerUpSelection = {
            x: event.clientX,
            text: selection?.toString(),
            anchor: selection?.anchorOffset,
            focus: selection?.focusOffset,
          };
        },
        { capture: true, once: true },
      );
    });
    await page.mouse.move(bounds.right - 1, bounds.y);
    await page.mouse.down();
    await page.mouse.move(bounds.left - 2, bounds.y, { steps: 12 });
    await page.mouse.up();
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    results.push(
      await page.evaluate((bounds) => {
        const selection = window.getSelection();
        return {
          bounds,
          text: selection?.toString(),
          anchor: selection?.anchorOffset,
          focus: selection?.focusOffset,
          pointerUp: (window as Window & { pointerUpSelection?: unknown }).pointerUpSelection,
        };
      }, bounds),
    );
  }
  await info.attach('native-selection-comparison', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  expect(results.map((result) => result.text)).toEqual(['Panel body selection', 'Panel body selection']);
});

for (const direction of ['forward', 'backward'] as const) {
  test(`compound paragraph ${direction} mouse selection can be replaced and undone`, async ({ page }, info) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = ':::warning Notice\nPanel body selection\n:::';
    await setMarkdown(page, original);
    const paragraph = page.locator('.cherry-panel--body p');
    await expect(paragraph).toHaveText('Panel body selection');
    const bounds = await paragraph.evaluate((element) => {
      const pointerEvents: Array<Record<string, unknown>> = [];
      (window as Window & { compoundPointerEvents?: Array<Record<string, unknown>> }).compoundPointerEvents =
        pointerEvents;
      for (const capture of [true, false]) {
        document.addEventListener(
          'pointerup',
          (event) => {
            const selection = window.getSelection();
            pointerEvents.push({
              capture,
              x: event.clientX,
              y: event.clientY,
              target: event.target instanceof Element ? event.target.getAttribute('class') : null,
              text: selection?.toString(),
              anchorOffset: selection?.anchorOffset,
              focusOffset: selection?.focusOffset,
            });
          },
          { capture, once: true },
        );
      }
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right, y: (rect.top + rect.bottom) / 2, fontStatus: document.fonts.status };
    });
    const start = direction === 'forward' ? bounds.left + 1 : bounds.right - 1;
    const end = direction === 'forward' ? bounds.right + 2 : bounds.left - 2;
    await page.mouse.move(start, bounds.y);
    await page.mouse.down();
    await page.mouse.move(end, bounds.y, { steps: 12 });
    await page.mouse.up();
    const afterDrag = await paragraph.evaluate(async (element) => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      const selection = window.getSelection();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        fontStatus: document.fonts.status,
        font: getComputedStyle(element).font,
        text: selection?.toString(),
        anchorText: selection?.anchorNode?.textContent,
        anchorOffset: selection?.anchorOffset,
        focusText: selection?.focusNode?.textContent,
        focusOffset: selection?.focusOffset,
        pointerEvents: (window as Window & { compoundPointerEvents?: Array<Record<string, unknown>> })
          .compoundPointerEvents,
      };
    });
    try {
      await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('Panel body selection');
    } catch (error) {
      await info.attach('drag-selection-diagnostics', {
        body: JSON.stringify({ direction, bounds, start, end, afterDrag }, null, 2),
        contentType: 'application/json',
      });
      throw error;
    }
    await page.keyboard.type('Replacement');
    await expect(paragraph).toHaveText('Replacement');
    await expect.poll(() => markdown(page)).toContain('Replacement');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
  });
}

for (const direction of ['forward', 'backward'] as const) {
  test(`compound ${direction} selection across paragraphs can be replaced and undone`, async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = ':::warning Notice\nFirst paragraph\n\nSecond paragraph\n:::';
    await setMarkdown(page, original);
    const paragraphs = page.locator('.cherry-panel--body p');
    await expect(paragraphs).toHaveCount(2);
    const point = async (index: number, edge: 'start' | 'end') =>
      paragraphs.nth(index).evaluate((element, edge) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const rect = range.getBoundingClientRect();
        return { x: edge === 'start' ? rect.left + 1 : rect.right + 2, y: (rect.top + rect.bottom) / 2 };
      }, edge);
    const first = await point(0, 'start');
    const last = await point(1, 'end');
    const start = direction === 'forward' ? first : last;
    const end = direction === 'forward' ? last : first;
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + (direction === 'forward' ? 30 : -30), start.y, { steps: 5 });
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeHidden();
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.mouse.up();
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString().replace(/\s/g, '')))
      .toBe('FirstparagraphSecondparagraph');
    await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeVisible();
    await page.keyboard.type('Replacement');
    await expect(page.locator('.cherry-panel--body')).toHaveText('Replacement');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(page.locator('.cherry-panel--body')).toHaveText('Replacement');
  });
}

test('read-only compound text remains selectable but cannot be edited', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?readonly');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = ':::warning Notice\nPanel body selection\n:::';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original);
  const paragraph = page.locator('.cherry-panel--body p');
  await expect(paragraph).toBeVisible();
  await paragraph.click({ clickCount: 3 });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe('Panel body selection');
  await page.keyboard.type('Changed');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await expect(paragraph).toHaveText('Panel body selection');
});

test('releasing a pointer outside the editor does not leave formatting controls disabled', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'A paragraph for selection');
  const paragraph = page.locator('.ProseMirror > p').first();
  const bounds = await paragraph.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + 10, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(page.viewportSize()!.width - 5, page.viewportSize()!.height - 5, { steps: 8 });
  await page.mouse.up();
  await paragraph.click({ clickCount: 3 });
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString().trim()))
    .toBe('A paragraph for selection');
  await expect(page.getByRole('toolbar', { name: '文本格式' })).toBeVisible();
  await page.getByRole('button', { name: '加粗' }).click();
  await expect.poll(() => markdown(page)).toContain('**A paragraph for selection**');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('A paragraph for selection');
});

test('touching compound text allows editing without selecting the containing block', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-touch', 'Requires Chromium touch emulation.');
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  const original = ':::warning Notice\nPanel body selection\n:::';
  await setMarkdown(page, original);
  await page.evaluate(() => {
    document.addEventListener(
      'pointerup',
      (event) => {
        if (event.pointerType === 'touch' && event.isTrusted) document.documentElement.dataset.compoundTouch = 'true';
      },
      { once: true, capture: true },
    );
  });
  const paragraph = page.locator('.cherry-panel--body p');
  await paragraph.tap();
  await expect(page.locator('html')).toHaveAttribute('data-compound-touch', 'true');
  await expect(page.locator('.cherry-compound.cherry-panel')).not.toHaveClass(/is-selected|ProseMirror-selectednode/);
  await page.keyboard.press('End');
  await page.keyboard.type(' added');
  await expect(paragraph).toHaveText('Panel body selection added');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(original);
});

for (const offset of [0, 4, 10]) {
  test(`touching a compound paragraph at offset ${offset} places immediate input correctly`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-touch', 'Requires Chromium touch emulation.');
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = ':::warning Notice\nabcdefghij\n:::';
    await setMarkdown(page, original);
    const paragraph = page.locator('.cherry-panel--body p');
    const point = await paragraph.evaluate((element, offset) => {
      const text = [...element.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent === 'abcdefghij',
      );
      if (!text) throw new Error('Missing compound text');
      const range = document.createRange();
      range.setStart(text, offset);
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      return { x: rect.left + 0.25, y: (rect.top + rect.bottom) / 2 };
    }, offset);
    await page.touchscreen.tap(point.x, point.y);
    await page.keyboard.type('X');
    const expected = `${'abcdefghij'.slice(0, offset)}X${'abcdefghij'.slice(offset)}`;
    await expect(paragraph).toHaveText(expected);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(paragraph).toHaveText(expected);
  });
}

test('touch position is preserved through native Chromium composition and undo', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-touch', 'Requires Chromium touch emulation and its native input protocol.');
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  const original = ':::warning Notice\n开始：结束\n:::';
  await setMarkdown(page, original);
  const paragraph = page.locator('.cherry-panel--body p');
  const point = await paragraph.evaluate((element) => {
    const text = [...element.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent === '开始：结束',
    );
    if (!text) throw new Error('Missing compound text');
    const range = document.createRange();
    range.setStart(text, 3);
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    return { x: rect.left + 0.25, y: (rect.top + rect.bottom) / 2 };
  });
  await page.touchscreen.tap(point.x, point.y);
  const input = await page.context().newCDPSession(page);
  try {
    await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
    await expect(paragraph).toHaveText('开始：nihao结束');
    await input.send('Input.insertText', { text: '你好' });
    await expect(paragraph).toHaveText('开始：你好结束');
    await expect.poll(() => markdown(page)).toContain('开始：你好结束');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
  } finally {
    await input.detach();
  }
});

for (const [ending, terminal] of [
  ['\n', ''],
  ['\n', '\n'],
  ['\n', '\n\n'],
  ['\r\n', '\r\n'],
] as const) {
  test(`touch composition preserves external prepend and ${JSON.stringify(terminal)} suffix`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== 'chromium-touch',
      'Requires Chromium touch emulation and its native input protocol.',
    );
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = [':::warning Notice', '开始：结束', ':::'].join(ending) + terminal;
    const external = `远程${ending}${ending}${original}`;
    await setMarkdown(page, original);
    const paragraph = page.locator('.cherry-panel--body p');
    const point = await paragraph.evaluate((element) => {
      const text = [...element.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent === '开始：结束',
      );
      if (!text) throw new Error('Missing compound text');
      const range = document.createRange();
      range.setStart(text, 3);
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      return { x: rect.left + 0.25, y: (rect.top + rect.bottom) / 2 };
    });
    await page.touchscreen.tap(point.x, point.y);
    const input = await page.context().newCDPSession(page);
    try {
      await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
      await expect(paragraph).toHaveText('开始：ni结束');
      await page.evaluate((value) => window.milkdownEditor!.setMarkdown(value, { emit: false }), external);
      await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
      await input.send('Input.insertText', { text: '你好' });
      await expect(paragraph).toHaveText('开始：你好结束');
      await expect.poll(() => markdown(page)).toBe(external.replace('开始：结束', '开始：你好结束'));
      await page.keyboard.press('ControlOrMeta+z');
      await expect.poll(() => markdown(page)).toBe(external);
      await page.keyboard.press('ControlOrMeta+Shift+z');
      await expect.poll(() => markdown(page)).toBe(external.replace('开始：结束', '开始：你好结束'));
    } finally {
      await input.detach();
    }
  });
}

test('touch composition keeps a real trailing paragraph during external updates', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-touch', 'Requires Chromium touch emulation and its native input protocol.');
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  const original = ':::warning Notice\n开始：结束\n:::\n\nTail text';
  const external = `远程\n\n${original}`;
  await setMarkdown(page, original);
  const paragraph = page.locator('.cherry-panel--body p');
  const point = await paragraph.evaluate((element) => {
    const text = [...element.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent === '开始：结束',
    );
    if (!text) throw new Error('Missing compound text');
    const range = document.createRange();
    range.setStart(text, 3);
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    return { x: rect.left + 0.25, y: (rect.top + rect.bottom) / 2 };
  });
  await page.touchscreen.tap(point.x, point.y);
  const input = await page.context().newCDPSession(page);
  try {
    await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
    await expect(paragraph).toHaveText('开始：ni结束');
    await page.evaluate((value) => window.milkdownEditor!.setMarkdown(value, { emit: false }), external);
    await input.send('Input.insertText', { text: '你好' });
    await expect.poll(() => markdown(page)).toBe(external.replace('开始：结束', '开始：你好结束'));
    await expect(page.locator('.ProseMirror > p').last()).toHaveText('Tail text');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(external);
  } finally {
    await input.detach();
  }
});

for (const offset of [0, 4, 10]) {
  test(`touch refocus after a link places immediate input at offset ${offset}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-touch', 'Requires Chromium touch emulation.');
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    const original = '[link](https://example.com)\n\nabcdefghij';
    await setMarkdown(page, original);
    await page.locator('.ProseMirror a').tap();
    await page.touchscreen.tap(8, page.viewportSize()!.height - 8);
    const paragraph = page.locator('.ProseMirror > p').last();
    const point = await paragraph.evaluate((element, offset) => {
      const text = [...element.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent === 'abcdefghij',
      );
      if (!text) throw new Error('Missing paragraph text');
      const range = document.createRange();
      range.setStart(text, offset);
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      return { x: rect.left + 0.25, y: (rect.top + rect.bottom) / 2 };
    }, offset);
    await page.touchscreen.tap(point.x, point.y);
    await page.keyboard.type('X');
    const expected = `${'abcdefghij'.slice(0, offset)}X${'abcdefghij'.slice(offset)}`;
    await expect(paragraph).toHaveText(expected);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
  });
}

test('touch link actions can reopen after an outside dismissal', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-touch', 'Requires Chromium touch emulation.');
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '[link](https://example.com)\n\nNext paragraph');
  const link = page.locator('.ProseMirror a');
  const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
  await link.tap();
  await expect(toolbar).toBeVisible();
  await page.touchscreen.tap(8, page.viewportSize()!.height - 8);
  await expect(toolbar).toBeHidden();
  await link.tap();
  await expect(toolbar).toBeVisible();
});

test('cancelled touch does not prevent later formatting', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-touch', 'Requires Chromium touch emulation.');
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, 'Touch cancellation text');
  await page.evaluate(() => {
    document.addEventListener(
      'pointercancel',
      (event) => {
        if (event.pointerType === 'touch' && event.isTrusted) document.documentElement.dataset.touchCancelled = 'true';
      },
      { once: true, capture: true },
    );
  });
  const paragraph = page.locator('.ProseMirror > p').first();
  const box = await paragraph.boundingBox();
  expect(box).not.toBeNull();
  const point = { x: box!.x + 40, y: box!.y + box!.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  await expect(page.locator('html')).toHaveAttribute('data-touch-cancelled', 'true');
  await paragraph.click({ clickCount: 3 });
  const bubble = page.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();
  await bubble.getByRole('button', { name: '加粗' }).click();
  await expect.poll(() => markdown(page)).toBe('**Touch cancellation text**');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('Touch cancellation text');
});

test('formatting controls follow focus between independent editors', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    window.uploadEditor!.setMarkdown('First editor content');
    window.secondUploadEditor = await window.createUploadEditor();
    window.secondUploadEditor.setMarkdown('Second editor content');
  });
  const first = page.locator('.cherry-milkdown').first();
  const second = page.locator('.cherry-milkdown').nth(1);
  const firstBubble = first.getByRole('toolbar', { name: '文本格式' });
  const secondBubble = second.getByRole('toolbar', { name: '文本格式' });
  await first.locator('.ProseMirror > p').first().click({ clickCount: 3 });
  await expect(firstBubble).toBeVisible();
  await second.locator('.ProseMirror > p').first().click({ clickCount: 3 });
  await expect(firstBubble).toBeHidden();
  await expect(secondBubble).toBeVisible();
  await secondBubble.getByRole('button', { name: '加粗' }).click();
  await expect
    .poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown()))
    .toBe('**Second editor content**');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('First editor content');
});

test('destroying an editor during pointer selection does not affect another editor', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    window.uploadEditor!.setMarkdown('First editor content');
    window.secondUploadEditor = await window.createUploadEditor();
    window.secondUploadEditor.setMarkdown('Second editor content');
  });
  const first = page.locator('.cherry-milkdown').first();
  const bounds = await first.locator('.ProseMirror > p').first().boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + 4, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 50, bounds!.y + bounds!.height / 2, { steps: 5 });
  await page.evaluate(() => window.uploadEditor!.destroy());
  await page.mouse.up();
  await expect(page.locator('.cherry-milkdown')).toHaveCount(1);
  const surviving = page.locator('.cherry-milkdown').first();
  await surviving.locator('.ProseMirror > p').first().click({ clickCount: 3 });
  const bubble = surviving.getByRole('toolbar', { name: '文本格式' });
  await expect(bubble).toBeVisible();
  await bubble.getByRole('button', { name: '加粗' }).click();
  await expect
    .poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown()))
    .toBe('**Second editor content**');
  await page.evaluate(() => window.secondUploadEditor!.destroy());
  await expect(page.locator('.cherry-milkdown')).toHaveCount(0);
});

test('a failed editor destruction does not interrupt another editor’s link actions', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?reject-destroy');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    window.secondUploadEditor = await window.createUploadEditor();
    window.secondUploadEditor.setMarkdown('[Second](https://example.com)', { emit: false });
    document.querySelectorAll<HTMLElement>('.cherry-milkdown')[1]!.dataset.owner = 'survivor';
  });
  const survivor = page.locator('.cherry-milkdown[data-owner="survivor"]');
  await survivor.locator('.ProseMirror a').click();
  const toolbar = survivor.getByRole('toolbar', { name: '链接', exact: true });
  await expect(toolbar).toBeVisible();
  const failure = await page.evaluate(async () => {
    try {
      await window.uploadEditor!.destroy();
      return 'fulfilled';
    } catch (error) {
      return String(error);
    }
  });
  expect(failure).toBe('Error: Plugin cleanup failed');
  await expect(page.locator('.cherry-milkdown')).toHaveCount(1);
  await expect(toolbar).toBeVisible();
  await page.keyboard.press('Alt+F10');
  await expect(toolbar.getByRole('link', { name: /打开链接/ })).toBeFocused();
  await toolbar.getByRole('button', { name: '编辑链接' }).click();
  const form = survivor.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://example.org/updated');
  await page.setViewportSize({ width: 700, height: 500 });
  await expect(form).toBeVisible();
  await expect(form.getByLabel('链接地址')).toHaveValue('https://example.org/updated');
  await form.getByRole('button', { name: '保存', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown()))
    .toBe('[Second](https://example.org/updated)');
  await page.evaluate(() => window.secondUploadEditor!.destroy().catch(() => {}));
  await expect(page.locator('.cherry-milkdown')).toHaveCount(0);
});

test('unsafe link actions stay isolated when another editor is destroyed', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    window.uploadEditor!.setMarkdown('[safe](https://example.com/safe)');
    window.secondUploadEditor = await window.createUploadEditor();
    window.secondUploadEditor.setMarkdown('[unsafe](javascript:alert%281%29)');
    const editors = document.querySelectorAll<HTMLElement>('.cherry-milkdown');
    editors[0].dataset.owner = 'first';
    editors[1].dataset.owner = 'second';
  });
  const first = page.locator('.cherry-milkdown[data-owner="first"]');
  const second = page.locator('.cherry-milkdown[data-owner="second"]');
  await first.locator('.ProseMirror a').click();
  await expect(first.getByRole('toolbar', { name: '链接', exact: true }).getByRole('link')).toHaveAttribute(
    'href',
    'https://example.com/safe',
  );
  await second.locator('.ProseMirror a').click();
  const toolbar = second.getByRole('toolbar', { name: '链接', exact: true });
  const open = toolbar.locator('.cherry-milkdown-link-bubble__href');
  await expect(open).not.toHaveAttribute('href');
  await expect(open).toHaveAttribute('aria-disabled', 'true');
  await page.evaluate(() => window.uploadEditor!.destroy());
  await expect(second.locator('.ProseMirror a')).toBeVisible();
  await second.locator('.ProseMirror a').click();
  await expect(open).not.toHaveAttribute('href');
  await expect(open).toHaveAttribute('aria-disabled', 'true');
  await toolbar.getByRole('button', { name: '编辑链接' }).click();
  const form = second.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://example.com/fixed');
  await form.getByRole('button', { name: '保存', exact: true }).click();
  await second.locator('.ProseMirror a').click();
  await expect(toolbar.getByRole('link')).toHaveAttribute('href', 'https://example.com/fixed');
  await page.evaluate(() => window.secondUploadEditor!.destroy());
});

for (const text of ['unsafe', 'safe'] as const)
  test(`an unsafe link labelled ${text} can be reopened after the second editor is destroyed`, async ({ page }) => {
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    await page.evaluate(async (text) => {
      window.uploadEditor!.setMarkdown(`[${text}](javascript:alert%281%29)`);
      window.secondUploadEditor = await window.createUploadEditor();
      window.secondUploadEditor.setMarkdown('[safe](https://example.com/safe)');
      const editors = document.querySelectorAll<HTMLElement>('.cherry-milkdown');
      editors[0].dataset.owner = 'first';
      editors[1].dataset.owner = 'second';
    }, text);
    const first = page.locator('.cherry-milkdown[data-owner="first"]');
    const second = page.locator('.cherry-milkdown[data-owner="second"]');
    await second.locator('.ProseMirror a').click();
    await first.locator('.ProseMirror a').click();
    const toolbar = first.getByRole('toolbar', { name: '链接', exact: true });
    await expect(toolbar).toBeVisible();
    await page.evaluate(() => window.secondUploadEditor!.destroy());
    await first.locator('.ProseMirror a').click();
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator('.cherry-milkdown-link-bubble__href')).not.toHaveAttribute('href');
    await page.evaluate(() => window.uploadEditor!.destroy());
  });

for (const rejects of [false, true]) {
  test(`repeated editor mount and ${rejects ? 'failed' : 'successful'} destruction releases pointer listeners`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const tracked = new Map<string, Set<EventListenerOrEventListenerObject>>();
      const add = document.addEventListener.bind(document);
      const remove = document.removeEventListener.bind(document);
      document.addEventListener = ((
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ) => {
        if (type === 'pointerup' || type === 'pointercancel') {
          const listeners = tracked.get(type) ?? new Set();
          listeners.add(listener);
          tracked.set(type, listeners);
        }
        return add(type, listener, options);
      }) as typeof document.addEventListener;
      document.removeEventListener = ((
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
      ) => {
        tracked.get(type)?.delete(listener);
        return remove(type, listener, options);
      }) as typeof document.removeEventListener;
      const windowListeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
      const addWindow = window.addEventListener.bind(window);
      const removeWindow = window.removeEventListener.bind(window);
      window.addEventListener = ((
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ) => {
        if (['blur', 'scroll', 'resize'].includes(type)) {
          const listeners = windowListeners.get(type) ?? new Set();
          listeners.add(listener);
          windowListeners.set(type, listeners);
        }
        return addWindow(type, listener, options);
      }) as typeof window.addEventListener;
      window.removeEventListener = ((
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
      ) => {
        windowListeners.get(type)?.delete(listener);
        return removeWindow(type, listener, options);
      }) as typeof window.removeEventListener;
      (window as typeof window & { pointerListenerCounts: () => number[] }).pointerListenerCounts = () => [
        ...['pointerup', 'pointercancel'].map((type) => tracked.get(type)?.size ?? 0),
        ...['blur', 'scroll', 'resize'].map((type) => windowListeners.get(type)?.size ?? 0),
      ];
    });
    await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
    await page.goto(`/upload-harness.html${rejects ? '?reject-destroy' : ''}`);
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const counts = () =>
      page.evaluate(() =>
        (window as typeof window & { pointerListenerCounts: () => number[] }).pointerListenerCounts(),
      );
    const baseline = await counts();
    for (let index = 0; index < 3; index += 1) {
      await page.evaluate(async () => {
        window.secondUploadEditor = await window.createUploadEditor();
      });
      const mounted = await counts();
      expect(mounted[0]).toBeGreaterThan(baseline[0]);
      expect(mounted[1]).toBeGreaterThan(baseline[1]);
      for (let type = 2; type < mounted.length; type += 1) {
        expect(mounted[type]).toBeGreaterThan(baseline[type]);
      }
      const status = await page.evaluate(async () => {
        const [result] = await Promise.allSettled([window.secondUploadEditor!.destroy()]);
        return result.status;
      });
      expect(status).toBe(rejects ? 'rejected' : 'fulfilled');
      await expect.poll(counts).toEqual(baseline);
    }
    const status = await page.evaluate(async () => {
      const [result] = await Promise.allSettled([window.uploadEditor!.destroy()]);
      return result.status;
    });
    expect(status).toBe(rejects ? 'rejected' : 'fulfilled');
    expect((await counts()).slice(0, 2)).toEqual([0, 0]);
  });
}
