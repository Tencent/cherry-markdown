import { test, expect, markdown, setMarkdown, placeTextCaret, colorContrast } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

test('the link inspector never exposes an executable imported link', async ({ page }) => {
  const source = '[unsafe](javascript:alert%281%29)';
  await setMarkdown(page, source);
  await page.locator('.ProseMirror a').click();
  const inspector = page.getByRole('toolbar', { name: '链接', exact: true });
  await expect(inspector).toBeVisible();
  const open = inspector.locator('.cherry-milkdown-link-bubble__href');
  await expect(open).not.toHaveAttribute('href');
  await expect(open).toHaveAttribute('aria-disabled', 'true');
  await expect(open).toHaveText('无法打开');
  await page.keyboard.press('Alt+F10');
  await expect(inspector.getByRole('button', { name: '复制链接' })).toBeFocused();
  expect(await markdown(page)).toBe(source);
  await inspector.getByRole('button', { name: '编辑链接' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  await dialog.getByLabel('链接地址').fill('https://example.com/safe');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await page.locator('.ProseMirror a').click();
  await expect(inspector.getByRole('link', { name: /打开链接/ })).toHaveAttribute('href', 'https://example.com/safe');
});

test('link actions remain within a narrow viewport', async ({ page }, info) => {
  await page.setViewportSize({ width: 200, height: 600 });
  await setMarkdown(page, '[link](https://example.com)');
  const activate = (control: ReturnType<typeof page.locator>) =>
    info.project.name === 'chromium-touch' ? control.tap() : control.click();
  await activate(page.locator('.ProseMirror a'));
  const inspector = page.getByRole('toolbar', { name: '链接', exact: true });
  await expect(inspector).toBeVisible();
  for (const control of await inspector.locator('a, button').all()) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(200);
  }
  await activate(inspector.getByRole('button', { name: '编辑链接' }));
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  await expect(dialog).toBeVisible();
  await activate(dialog.getByRole('button', { name: '取消' }));
  await activate(page.locator('.ProseMirror a'));
  await activate(inspector.getByRole('button', { name: '取消链接' }));
  await expect.poll(() => markdown(page)).toBe('link');
});

for (const href of ['JaVaScRiPt:alert%281%29', 'data:text/html,unsafe', 'vbscript:msgbox%281%29']) {
  test(`the link inspector disables imported ${href.split(':')[0]} links`, async ({ page }) => {
    await setMarkdown(page, `[unsafe](${href})`);
    await page.locator('.ProseMirror a').click();
    const open = page.getByRole('toolbar', { name: '链接', exact: true }).locator('.cherry-milkdown-link-bubble__href');
    await expect(open).not.toHaveAttribute('href');
    await expect(open).toHaveAttribute('aria-disabled', 'true');
  });
}

test('the link inspector disables a dangerous link pasted as HTML', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await setMarkdown(page, 'Start');
  await page.evaluate(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob(['unsafe'], { type: 'text/plain' }),
        'text/html': new Blob(['<a href="javascript:alert%281%29">unsafe</a>'], { type: 'text/html' }),
      }),
    ]),
  );
  await page.locator('.ProseMirror > p').first().click();
  await page.keyboard.press('End');
  await page.keyboard.press('ControlOrMeta+v');
  const link = page.locator('.ProseMirror a').filter({ hasText: 'unsafe' });
  await expect(link).toBeVisible();
  await link.click();
  const open = page.getByRole('toolbar', { name: '链接', exact: true }).locator('.cherry-milkdown-link-bubble__href');
  await expect(open).not.toHaveAttribute('href');
  await expect(open).toHaveAttribute('aria-disabled', 'true');
});

test('switching between safe and unsafe links updates all link actions', async ({ page }) => {
  const value = '[safe](https://example.com/safe)\n\nGap\n\n[unsafe](javascript:alert%281%29)';
  await setMarkdown(page, value);
  const inspector = page.getByRole('toolbar', { name: '链接', exact: true });
  const open = inspector.locator('.cherry-milkdown-link-bubble__href');
  await page.locator('.ProseMirror a').first().click();
  await expect(open).toHaveAttribute('href', 'https://example.com/safe');
  await expect(open).not.toHaveAttribute('aria-disabled');
  await page.locator('.ProseMirror a').last().click();
  await expect(open).not.toHaveAttribute('href');
  await expect(open).toHaveAttribute('aria-disabled', 'true');
  await expect(open).toHaveText('无法打开');
  await page.locator('.ProseMirror a').first().click();
  await expect(open).toHaveAttribute('href', 'https://example.com/safe');
  await expect(open).not.toHaveAttribute('aria-disabled');
  await expect(open).toHaveText('打开链接');
  expect(await markdown(page)).toBe(value);
});

test('external replacement of an inspected safe link cannot leave its old address open', async ({ page }) => {
  await setMarkdown(page, '[link](https://example.com/safe)');
  await page.locator('.ProseMirror a').click();
  const inspector = page.getByRole('toolbar', { name: '链接', exact: true });
  const open = inspector.locator('.cherry-milkdown-link-bubble__href');
  await expect(open).toHaveAttribute('href', 'https://example.com/safe');
  const removedImmediately = await page.evaluate(() => {
    window.milkdownEditor!.setMarkdown('[link](javascript:alert%281%29)');
    const toolbar = document.querySelector<HTMLElement>('.cherry-milkdown-link-bubble');
    const link = toolbar?.querySelector('a');
    return !toolbar || toolbar.hidden || !link?.hasAttribute('href');
  });
  expect(removedImmediately).toBe(true);
  await page.locator('.ProseMirror a').click();
  await expect(inspector).toBeVisible();
  await expect(open).not.toHaveAttribute('href');
  await expect(open).toHaveAttribute('aria-disabled', 'true');
});

test('editing the end and undo preserve a document without a final newline', async ({ page }) => {
  await setMarkdown(page, 'Initial text');
  const paragraph = page.locator('.ProseMirror > p').first();
  const point = await paragraph.evaluate((element) => {
    const text = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)!;
    const range = document.createRange();
    range.selectNodeContents(text);
    const rect = range.getBoundingClientRect();
    return { x: rect.right - 1, y: (rect.top + rect.bottom) / 2 };
  });
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type(' edited');
  await expect.poll(() => markdown(page)).toBe('Initial text edited');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('Initial text');
});

for (const terminal of ['', '\n', '\n\n']) {
  test(`new paragraph undo survives a controlled echo with ${terminal.length} original terminal newlines`, async ({
    page,
  }) => {
    const original = `Text${terminal}`;
    await setMarkdown(page, original);
    await placeTextCaret(page, page.locator('.ProseMirror > p').first(), 'Text', 4);
    await page.keyboard.press('Enter');
    await page.keyboard.type('Next');
    await expect(page.locator('.ProseMirror > p').filter({ hasText: 'Next' })).toHaveCount(1);
    const edited = await markdown(page);
    await setMarkdown(page, edited);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => markdown(page)).toBe(edited);
  });
}

test('editing a new branch after undo does not restore stale content or newlines', async ({ page }) => {
  await setMarkdown(page, 'Text');
  await placeTextCaret(page, page.locator('.ProseMirror > p').first(), 'Text', 4);
  await page.keyboard.press('Enter');
  await page.keyboard.type('First');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('Text');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second');
  await expect(page.locator('.ProseMirror')).toContainText('Second');
  await expect(page.locator('.ProseMirror')).not.toContainText('First');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('Text');
});

for (const terminal of ['', '\r\n', '\r\n\r\n']) {
  test(`undo and redo preserve a CRLF document with ${terminal.length / 2} terminal newlines`, async ({ page }) => {
    const original = `First\r\n\r\nSecond${terminal}`;
    await setMarkdown(page, original);
    expect(await markdown(page)).toBe(original);
    await placeTextCaret(page, page.locator('.ProseMirror > p').filter({ hasText: 'Second' }), 'Second', 6);
    await page.keyboard.press('Enter');
    await page.keyboard.type('Third');
    await expect(page.locator('.ProseMirror > p').filter({ hasText: 'Third' })).toHaveCount(1);
    const edited = await markdown(page);
    expect(edited.replace(/\r\n/g, '')).not.toContain('\n');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => markdown(page)).toBe(edited);
  });
}

test('malformed fragment links do not crash editing or alter the document', async ({ page }) => {
  const value = '[bad fragment](#%E0%A4%A)\n\nEditable';
  await setMarkdown(page, value);
  await page.locator('.ProseMirror a').click();
  expect(await markdown(page)).toBe(value);
  // On narrow screens the link controls may cover the next paragraph.
  // Dismiss them with a real pointer action before continuing to edit.
  await page.mouse.click(8, page.viewportSize()!.height - 8);
  await expect(page.getByRole('toolbar', { name: '链接', exact: true })).toBeHidden();
  const paragraph = page.locator('.ProseMirror > p').last();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' text');
  await expect(paragraph).toHaveText('Editable text');
});

for (const offset of [0, 4, 10]) {
  test(`refocusing after a link places the clicked caret at offset ${offset}`, async ({ page }) => {
    const original = '[link](https://example.com)\n\nabcdefghij';
    await setMarkdown(page, original);
    await page.locator('.ProseMirror a').click();
    await page.mouse.click(8, page.viewportSize()!.height - 8);
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
    await page.mouse.click(point.x, point.y);
    await page.keyboard.type('X');
    await expect(paragraph).toHaveText(`${'abcdefghij'.slice(0, offset)}X${'abcdefghij'.slice(offset)}`);
    expect(await markdown(page)).toBe(
      `[link](https://example.com)\n\n${'abcdefghij'.slice(0, offset)}X${'abcdefghij'.slice(offset)}`,
    );
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
  });
}

test('refocusing from a host input edits the clicked paragraph, not the previous caret', async ({ page }) => {
  const original = 'First paragraph\n\nSecond paragraph';
  await setMarkdown(page, original);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'host-refocus-input';
    Object.assign(input.style, { position: 'fixed', bottom: '10px', right: '10px' });
    document.body.append(input);
  });
  const paragraphs = page.locator('.ProseMirror > p');
  await paragraphs.first().click();
  await page.locator('#host-refocus-input').click();
  await expect(page.locator('#host-refocus-input')).toBeFocused();
  await paragraphs.nth(1).click();
  await page.keyboard.press('End');
  await page.keyboard.type(' added');
  await expect(paragraphs.nth(1)).toHaveText('Second paragraph added');
  await expect(paragraphs.first()).toHaveText('First paragraph');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(original);
});

test('refocusing works when the host is contenteditable=false', async ({ page }) => {
  const original = '[link](https://example.com)\n\nEditable';
  await setMarkdown(page, original);
  await page.locator('.cherry-milkdown').evaluate((element) => {
    element.parentElement!.setAttribute('contenteditable', 'false');
  });
  await page.locator('.ProseMirror a').click();
  await page.mouse.click(8, page.viewportSize()!.height - 8);
  const paragraph = page.locator('.ProseMirror > p').last();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' text');
  await expect(paragraph).toHaveText('Editable text');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(original);
});

test('encoded Chinese fragments navigate to the matching heading', async ({ page }) => {
  const value = '# 中文 标题\n\n[导航](#%E4%B8%AD%E6%96%87-%E6%A0%87%E9%A2%98)';
  await setMarkdown(page, value);
  const heading = page.locator('.ProseMirror h1');
  await expect(heading).toHaveAttribute('id', '中文-标题');
  await page.getByRole('link', { name: '导航' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#%E4%B8%AD%E6%96%87-%E6%A0%87%E9%A2%98');
  expect(await markdown(page)).toBe(value);
});

test('a literal percent in a heading remains reachable from an unescaped fragment', async ({ page }) => {
  const value = '# file%zz\n\n[Go](#file%zz)';
  await setMarkdown(page, value);
  await expect(page.locator('.ProseMirror h1')).toHaveAttribute('id', 'file%zz');
  await page.getByRole('link', { name: 'Go', exact: true }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#file%25zz');
  expect(await markdown(page)).toBe(value);
});

test('clicking outside dismisses link actions and the same link can reopen them', async ({ page }) => {
  const value = '[link](https://example.com)\n\nNext paragraph';
  await setMarkdown(page, value);
  const link = page.getByRole('link', { name: 'link', exact: true });
  const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
  await link.click();
  await expect(toolbar).toBeVisible();
  await page.mouse.click(8, page.viewportSize()!.height - 8);
  await expect(toolbar).toBeHidden();
  await link.click();
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole('button', { name: '编辑链接' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  expect(await markdown(page)).toBe(value);
});

test('a delayed link copy does not report success on a different link', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, 'ClipboardItem', { configurable: true, value: class {} });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: () =>
          new Promise<void>((resolve) => ((window as Window & { finishCopy?: () => void }).finishCopy = resolve)),
      },
    });
  });
  await setMarkdown(page, '[First](https://first.example)\n\nSpacer\n\n[Second](https://second.example)');
  await page.locator('.ProseMirror a').first().click();
  const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
  await toolbar.getByRole('button', { name: '复制链接' }).click();
  await page.waitForFunction(() => Boolean((window as Window & { finishCopy?: () => void }).finishCopy));
  await page.locator('.ProseMirror a').last().click();
  await expect(toolbar.getByRole('link', { name: /打开链接/ })).toHaveAttribute('href', 'https://second.example');
  await page.evaluate(async () => {
    (window as Window & { finishCopy?: () => void }).finishCopy?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(await toolbar.locator('button').first().getAttribute('aria-label')).toBe('复制链接');
  await toolbar.getByRole('button', { name: '复制链接' }).click();
  await page.evaluate(async () => {
    (window as Window & { finishCopy?: () => void }).finishCopy?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(await toolbar.locator('button').first().getAttribute('aria-label')).toBe('已复制');
  await page.locator('.ProseMirror a').first().click();
  await expect(toolbar.getByRole('link', { name: /打开链接/ })).toHaveAttribute('href', 'https://first.example');
  expect(await toolbar.locator('button').first().getAttribute('aria-label')).toBe('复制链接');
});

test('a delayed code copy does not report success after the code changes', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window, 'ClipboardItem', { configurable: true, value: class {} });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: () =>
          new Promise<void>((resolve) => ((window as Window & { finishCopy?: () => void }).finishCopy = resolve)),
      },
    });
  });
  await setMarkdown(page, '```js\nconst value = 1;\n```');
  const code = page.locator('.cherry-milkdown-code-block');
  const copy = code.getByRole('button', { name: '复制代码' });
  await copy.click();
  await page.waitForFunction(() => Boolean((window as Window & { finishCopy?: () => void }).finishCopy));
  await code.locator('code').click();
  await page.keyboard.press('End');
  await page.keyboard.type('x');
  await expect(code.locator('code')).toContainText('1;x');
  await page.evaluate(async () => {
    (window as Window & { finishCopy?: () => void }).finishCopy?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(await copy.textContent()).toBe('复制');
});

for (const target of ['link', 'code'] as const) {
  test(`an older ${target} copy failure cannot overwrite a newer success`, async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(window, 'ClipboardItem', { configurable: true, value: class {} });
      Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          write: () =>
            new Promise<void>((resolve, reject) => {
              const state = window as Window & { copies?: Array<{ resolve: () => void; reject: () => void }> };
              (state.copies ??= []).push({ resolve, reject: () => reject(new Error('late clipboard failure')) });
            }),
        },
      });
    });
    await setMarkdown(page, target === 'link' ? '[Link](https://example.com)' : '```js\nconst value = 1;\n```');
    if (target === 'link') await page.locator('.ProseMirror a').click();
    const button =
      target === 'link'
        ? page.getByRole('toolbar', { name: '链接', exact: true }).locator('button').first()
        : page.locator('.cherry-milkdown-code-block').getByRole('button', { name: '复制代码' });
    await button.click();
    await button.click();
    await page.waitForFunction(() => (window as Window & { copies?: unknown[] }).copies?.length === 2);
    await page.evaluate(async () => {
      const copies = (window as Window & { copies?: Array<{ resolve: () => void; reject: () => void }> }).copies;
      copies?.[1]?.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(target === 'link' ? await button.getAttribute('aria-label') : await button.textContent()).toBe('已复制');
    await page.evaluate(async () => {
      const copies = (window as Window & { copies?: Array<{ resolve: () => void; reject: () => void }> }).copies;
      copies?.[0]?.reject();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(target === 'link' ? await button.getAttribute('aria-label') : await button.textContent()).toBe('已复制');
  });
}

for (const target of ['link', 'code'] as const)
  test(`an older failed link copy cannot overwrite newer ${target} in the clipboard`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => {
      const clipboard = navigator.clipboard;
      let first = true;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: clipboard.readText.bind(clipboard),
          write: (items: ClipboardItems) => {
            if (!first) return clipboard.write(items);
            first = false;
            return new Promise<void>((_resolve, reject) => {
              (window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy = () =>
                reject(new Error('late failure'));
            });
          },
        },
      });
    });
    await setMarkdown(
      page,
      '[First](https://first.example)\n\nSpacer\n\n[Second](https://second.example)\n\n```js\nconst value = 1;\n```',
    );
    await page.locator('.ProseMirror a').first().click();
    const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
    await toolbar.getByRole('button', { name: '复制链接' }).click();
    await page.waitForFunction(() => Boolean((window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy));
    const expected =
      target === 'link'
        ? 'https://second.example'
        : (await page.locator('.cherry-milkdown-code-block code').textContent())!;
    if (target === 'link') {
      await page.locator('.ProseMirror a').last().click();
      await toolbar.getByRole('button', { name: '复制链接' }).click();
    } else {
      await page.locator('.cherry-milkdown-code-block').getByRole('button', { name: '复制代码' }).click();
    }
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    await page.evaluate(async () => {
      (window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  });

for (const action of ['copy', 'cut'] as const)
  test(`an older failed link copy cannot overwrite a later keyboard ${action}`, async ({ page, browserName }, info) => {
    test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(async () => {
      const clipboard = navigator.clipboard;
      await clipboard.writeText('keyboard-copy-sentinel');
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: clipboard.readText.bind(clipboard),
          write: () =>
            new Promise<void>((_resolve, reject) => {
              (window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy = () =>
                reject(new Error('late failure'));
            }),
        },
      });
    });
    await setMarkdown(page, '[First](https://first.example)\n\nKeyboard copy text');
    await page.locator('.ProseMirror a').click();
    await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '复制链接' }).click();
    await page.waitForFunction(() => Boolean((window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy));
    if (info.project.name === 'chromium-touch') {
      // On a narrow screen the link toolbar can cover the next paragraph. Dismiss it
      // with a real touch before moving to that paragraph, as a user would.
      const viewport = page.viewportSize()!;
      await page.touchscreen.tap(viewport.width - 5, viewport.height - 5);
      await expect(page.getByRole('toolbar', { name: '链接', exact: true })).toBeHidden();
    }
    const paragraph = page.locator('.ProseMirror p').filter({ hasText: 'Keyboard copy text' });
    await paragraph.click();
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+End');
    await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+${action === 'copy' ? 'C' : 'X'}`);
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Keyboard copy text');
    await page.evaluate(async () => {
      (window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Keyboard copy text');
  });

for (const { target, removeBlock } of [
  { target: 'link', removeBlock: false },
  { target: 'code', removeBlock: false },
  { target: 'code', removeBlock: true },
] as const) {
  test(`${removeBlock ? 'removing the code block' : 'destroying the editor'} cancels an unfinished ${target} copy fallback`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => {
      const clipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: clipboard.readText.bind(clipboard),
          writeText: clipboard.writeText.bind(clipboard),
          write: () =>
            new Promise<void>((_resolve, reject) => {
              (window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy = () =>
                reject(new Error('late failure'));
            }),
        },
      });
    });
    await setMarkdown(page, '[First](https://first.example)\n\n```js\nconst value = 1;\n```');
    if (target === 'link') {
      await page.locator('.ProseMirror a').click();
      await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '复制链接' }).click();
    } else {
      await page.locator('.cherry-milkdown-code-block').getByRole('button', { name: '复制代码' }).click();
    }
    await page.waitForFunction(() => Boolean((window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy));
    await page.evaluate(async (removeBlock) => {
      if (removeBlock) window.milkdownEditor!.setMarkdown('Replacement');
      else await window.milkdownEditor!.destroy();
      await navigator.clipboard.writeText('new clipboard content');
      (window as Window & { rejectOlderCopy?: () => void }).rejectOlderCopy?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }, removeBlock);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('new clipboard content');
  });
}

test('copy fallback writes to the real clipboard and reports success', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    (window as Window & { realClipboard?: Clipboard }).realClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });
  await setMarkdown(page, '[First](https://first.example)');
  await page.locator('.ProseMirror a').click();
  const button = page.getByRole('toolbar', { name: '链接', exact: true }).locator('button').first();
  await button.click();
  await expect(button).toHaveAttribute('aria-label', '已复制');
  expect(await page.evaluate(() => (window as Window & { realClipboard?: Clipboard }).realClipboard!.readText())).toBe(
    'https://first.example',
  );
});

test('copy reports failure when a host listener prevents its fallback handler from running', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(async () => {
    const clipboard = navigator.clipboard;
    (window as Window & { realClipboard?: Clipboard }).realClipboard = clipboard;
    await clipboard.writeText('sentinel');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    document.addEventListener('copy', (event) => event.stopImmediatePropagation(), { capture: true });
  });
  await setMarkdown(page, '[First](https://first.example)');
  await page.locator('.ProseMirror a').click();
  const button = page.getByRole('toolbar', { name: '链接', exact: true }).locator('button').first();
  await button.click();
  await expect(button).toHaveAccessibleName('复制失败');
  expect(
    await page.evaluate(() => (window as Window & { realClipboard?: Clipboard }).realClipboard!.readText()),
  ).not.toBe('https://first.example');
});

test('copy falls back when clipboard access throws', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    (window as Window & { realClipboard?: Clipboard }).realClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      get() {
        throw new DOMException('Clipboard access denied', 'SecurityError');
      },
    });
  });
  await setMarkdown(page, '[First](https://first.example)');
  await page.locator('.ProseMirror a').click();
  const button = page.getByRole('toolbar', { name: '链接', exact: true }).locator('button').first();
  await button.click();
  await expect(button).toHaveAccessibleName('已复制');
  expect(await page.evaluate(() => (window as Window & { realClipboard?: Clipboard }).realClipboard!.readText())).toBe(
    'https://first.example',
  );
});

test('link and code copy share the fallback and report actual results', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: () => {
        document.dispatchEvent(
          new ClipboardEvent('copy', { clipboardData: new DataTransfer(), bubbles: true, cancelable: true }),
        );
        return true;
      },
    });
  });
  await setMarkdown(page, '[link](https://example.com)\n\n```js\nconst value = 1;\n```');
  const saved = await markdown(page);
  const code = page.locator('.cherry-milkdown-code-block');
  const copy = code.getByRole('button', { name: '复制代码' });
  await copy.click();
  await expect(copy).toHaveText('已复制');
  await expect(copy).toHaveText('复制');
  await page
    .locator('.ProseMirror a')
    .first()
    .click({ position: { x: 8, y: 8 } });
  const linkCopy = page.getByRole('toolbar', { name: '链接' }).getByRole('button').first();
  await linkCopy.click();
  await expect(linkCopy).toHaveAccessibleName('已复制');
  await expect(linkCopy).toHaveAccessibleName('复制链接');
  await page.evaluate(() => Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false }));
  await linkCopy.click();
  await expect(linkCopy).toHaveAccessibleName('复制失败');
  await copy.click();
  await expect(copy).toHaveText('复制失败');
  expect(await markdown(page)).toBe(saved);
});

test('link editing rejects encoded schemes using the Cherry policy without changing the document', async ({ page }) => {
  await setMarkdown(page, '[link](https://example.com)');
  const saved = await markdown(page);
  await page
    .locator('.ProseMirror a')
    .first()
    .click({ position: { x: 8, y: 8 } });
  await page.getByRole('toolbar', { name: '链接' }).getByRole('button', { name: '编辑链接' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  for (const href of ['j&#97;vascript:alert(1)', 'java&#x73;cript:alert(1)', 'data:text/html,test']) {
    await dialog.getByLabel('链接地址').fill(href);
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog.locator('.cherry-milkdown-link-editor__error')).toHaveText('请输入有效的链接地址。');
    expect(await markdown(page)).toBe(saved);
  }
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  expect(await markdown(page)).toBe(saved);
});

test('link actions support keyboard dismissal and one-step unlink with undo', async ({ page }) => {
  const source = 'Before [one **two** three](https://example.com){target=_blank} after.';
  await setMarkdown(page, source);
  const link = page.locator('.ProseMirror a').last();
  await link.click({ position: { x: 8, y: 8 } });
  const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
  await expect(toolbar).toBeVisible();
  const open = toolbar.getByRole('link');
  await expect(open).toHaveText('打开链接');
  await expect(open).toHaveAttribute('href', 'https://example.com');
  await page.keyboard.press('Alt+F10');
  await expect(open).toBeFocused();
  expect(await markdown(page)).toBe(source);
  await page.keyboard.press('Tab');
  await expect(toolbar.getByRole('button', { name: '复制链接' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toolbar).toBeHidden();
  await expect(page.locator('.ProseMirror')).toBeFocused();
  expect(await markdown(page)).toBe(source);

  await page.keyboard.press('Alt+F10');
  await expect(open).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(toolbar.getByRole('button', { name: '编辑链接' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toolbar.getByRole('button', { name: '取消链接' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ProseMirror a')).toHaveCount(0);
  await expect(page.locator('.ProseMirror strong')).toHaveText('two');
  expect(await markdown(page)).not.toContain('{target=');
  await page.keyboard.press('ControlOrMeta+z');
  expect(await markdown(page)).toBe(source);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(page.locator('.ProseMirror a')).toHaveCount(0);
});

test('link action shortcut leaves ordinary text and Tab editing behavior intact', async ({ page }) => {
  await setMarkdown(page, 'Plain text');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  const saved = await markdown(page);
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.ProseMirror')).toBeFocused();
  expect(await markdown(page)).toBe(saved);
  await page.keyboard.press('Tab');
  expect(await paragraph.textContent()).toContain('  ');
});

test('unsaved link fields and focus survive document scrolling and viewport resizing', async ({ page }) => {
  await setMarkdown(
    page,
    ['[link](https://example.com)', ...Array.from({ length: 35 }, (_, i) => `Paragraph ${i}`)].join('\n\n'),
  );
  const saved = await markdown(page);
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  const input = form.getByLabel('链接地址');
  await input.fill('./一个很长的相对路径/文档.md');
  await page.evaluate(() => window.scrollBy(0, 100));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(form).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('./一个很长的相对路径/文档.md');
  await page.setViewportSize({ width: 360, height: 640 });
  await expect(form).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('./一个很长的相对路径/文档.md');
  await expect
    .poll(async () => {
      const rect = await form.boundingBox();
      return Boolean(rect && rect.x >= 8 && rect.x + rect.width <= 352 && rect.y >= 8 && rect.y + rect.height <= 632);
    })
    .toBe(true);
  expect(await markdown(page)).toBe(saved);
  await page.keyboard.press('Escape');
  await expect(form).toBeHidden();
  expect(await markdown(page)).toBe(saved);
});

test('link fields remain editable and saveable in a short viewport', async ({ page }) => {
  await setMarkdown(page, '[link](https://example.com)');
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await page.setViewportSize({ width: 320, height: 120 });
  await expect(form).toBeVisible();
  expect(await form.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await form.getByLabel('链接显示文本').fill('updated');
  await form.getByLabel('链接地址').fill('https://example.org/path');
  await form.getByRole('button', { name: '保存' }).click();
  await expect(form).toBeHidden();
  await expect.poll(() => markdown(page)).toContain('[updated](https://example.org/path)');
});

for (const theme of ['default', 'dark'] as const) {
  test(`link editing remains reachable at mobile width in ${theme} theme`, async ({ page }, info) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate((theme) => window.milkdownEditor!.setTheme(theme), theme);
    const original = '[link](https://example.com)\n\nPlain paragraph';
    await setMarkdown(page, original);
    const touch = info.project.name === 'chromium-touch';
    const activate = async (target: ReturnType<typeof page.locator>) => (touch ? target.tap() : target.click());
    await activate(page.locator('.ProseMirror a'));
    const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
    await expect(toolbar).toBeVisible();
    await activate(toolbar.getByRole('button', { name: '编辑链接' }));
    const form = page.getByRole('dialog', { name: '编辑链接' });
    await expect(form).toBeVisible();
    const box = await form.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    expect(box!.y + box!.height).toBeLessThanOrEqual(568);
    await form.getByLabel('链接地址').fill('https://example.org/path');
    await activate(form.getByRole('button', { name: '保存', exact: true }));
    await expect.poll(() => markdown(page)).toBe('[link](https://example.org/path)\n\nPlain paragraph');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(original);
  });
}

for (const theme of ['default', 'dark', 'abyss', 'green', 'red', 'gray', 'violet', 'blue'] as const) {
  test(`link save button has readable contrast in ${theme} theme`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate((theme) => window.milkdownEditor!.setTheme(theme), theme);
    await setMarkdown(page, '[link](https://example.com)');
    await page.locator('.ProseMirror a').click();
    await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
    const button = page.getByRole('dialog', { name: '编辑链接' }).getByRole('button', { name: '保存', exact: true });
    const colors = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      return { foreground: style.color, background: style.backgroundColor };
    });
    expect(colorContrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  });
}

test('switching themes updates an open link form without losing unsaved fields', async ({ page }) => {
  const original = '[link](https://example.com)';
  await setMarkdown(page, original);
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  const address = form.getByLabel('链接地址');
  await address.fill('https://example.org/unsaved');
  const lightBackground = await form.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.evaluate(() => window.milkdownEditor!.setTheme('dark'));
  await expect(form).toBeVisible();
  await expect(address).toHaveValue('https://example.org/unsaved');
  await expect(form).not.toHaveCSS('background-color', lightBackground);
  expect(await markdown(page)).toBe(original);
});

for (const theme of ['default', 'dark', 'red'] as const) {
  test(`keyboard focus is visible on the link save button and Enter saves in ${theme} theme`, async ({ page }) => {
    await page.evaluate((theme) => window.milkdownEditor!.setTheme(theme), theme);
    await setMarkdown(page, '[link](https://example.com)');
    await page.locator('.ProseMirror a').click();
    await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
    const form = page.getByRole('dialog', { name: '编辑链接' });
    const address = form.getByLabel('链接地址');
    const save = form.getByRole('button', { name: '保存', exact: true });
    await address.fill('https://example.org');
    const focusStyle = () =>
      save.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.outlineStyle, style.outlineWidth, style.outlineColor, style.boxShadow, style.borderColor];
      });
    const unfocused = await focusStyle();
    await address.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(save).toBeFocused();
    expect(await focusStyle()).not.toEqual(unfocused);
    await page.keyboard.press('Enter');
    await expect.poll(() => markdown(page)).toBe('[link](https://example.org)');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe('[link](https://example.com)');
  });
}

test('an unrelated external prepend preserves unsaved link fields and undo', async ({ page }) => {
  await setMarkdown(page, '[link](https://old.example)\n\nTail');
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  const input = form.getByLabel('链接地址');
  await input.fill('https://edited.example');
  await setMarkdown(page, 'Prepend\n\n[link](https://old.example)\n\nTail');
  await expect(form).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('https://edited.example');
  await setMarkdown(page, 'Prepend\n\n[link](https://old.example)\n\nTail extended');
  await expect(form).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('https://edited.example');
  await form.getByRole('button', { name: '保存' }).click();
  await expect.poll(() => markdown(page)).toBe('Prepend\n\n[link](https://edited.example)\n\nTail extended');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('Prepend\n\n[link](https://old.example)\n\nTail extended');
});

test('creating a link survives an unrelated external prepend', async ({ page }) => {
  await setMarkdown(page, 'Selected text\n\nTail');
  await page.locator('.ProseMirror > p').first().click();
  await page.keyboard.press('Home');
  for (let index = 0; index < 'Selected text'.length; index++) await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('Selected text');
  await page.keyboard.press('ControlOrMeta+k');
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await expect(form.getByLabel('链接显示文本')).toHaveValue('Selected text');
  const input = form.getByLabel('链接地址');
  await input.fill('https://example.com');
  await setMarkdown(page, 'Prefix\n\nSelected text\n\nTail');
  await expect(form).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('https://example.com');
  await form.getByRole('button', { name: '保存' }).click();
  await expect.poll(() => markdown(page)).toBe('Prefix\n\n[Selected text](https://example.com)\n\nTail');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('Prefix\n\nSelected text\n\nTail');
});

test('creating a link closes when external text makes the selection ambiguous', async ({ page }) => {
  await setMarkdown(page, 'Selected text\n\nTail');
  if (process.env.MILKDOWN_SELECTION_DIAGNOSTICS === '1')
    await page.evaluate(() => {
      const trace: unknown[] = [];
      (window as Window & { linkSelectionTrace?: unknown[] }).linkSelectionTrace = trace;
      for (const name of ['focusin', 'selectionchange', 'milkdown-focus-probe'])
        document.addEventListener(
          name,
          (event) => {
            const selection = window.getSelection();
            trace.push({
              time: performance.now(),
              event: name,
              text: selection?.toString(),
              detail: event instanceof CustomEvent ? event.detail : undefined,
            });
          },
          true,
        );
    });
  await page.locator('.ProseMirror > p').first().click();
  await page
    .locator('.ProseMirror > p')
    .first()
    .evaluate((paragraph) => {
      const range = document.createRange();
      range.selectNodeContents([...paragraph.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)!);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });
  try {
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('Selected text');
  } catch (error) {
    if (process.env.MILKDOWN_SELECTION_DIAGNOSTICS === '1')
      console.log(
        'LINK_SELECTION_TRACE',
        JSON.stringify(
          await page.evaluate(() => (window as Window & { linkSelectionTrace?: unknown }).linkSelectionTrace),
        ),
      );
    throw error;
  }
  await page.keyboard.press('ControlOrMeta+k');
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://example.com');
  await setMarkdown(page, 'Selected text\n\nSelected text\n\nTail');
  await expect(form).toBeHidden();
  expect(await markdown(page)).toBe('Selected text\n\nSelected text\n\nTail');
});

for (const direction of ['forward', 'backward'] as const) {
  for (const externalUpdate of [false, true]) {
    test(`mouse ${direction} selection creates exactly the selected link${externalUpdate ? ' after an external prepend' : ''} and supports undo`, async ({
      page,
    }) => {
      await setMarkdown(page, 'Before middle after');
      const paragraph = page.locator('.ProseMirror > p').first();
      const points = await paragraph.evaluate((element) => {
        const text = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)!;
        const rect = (start: number, end: number) => {
          const range = document.createRange();
          range.setStart(text, start);
          range.setEnd(text, end);
          const box = range.getBoundingClientRect();
          return { left: box.left, right: box.right, y: (box.top + box.bottom) / 2 };
        };
        return { first: rect(7, 8), last: rect(12, 13) };
      });
      const start = { x: points.first.left + 0.5, y: points.first.y };
      const end = { x: points.last.right - 0.5, y: points.last.y };
      const [from, to] = direction === 'forward' ? [start, end] : [end, start];
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 8 });
      await page.mouse.up();
      await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('middle');
      await page.keyboard.press('ControlOrMeta+k');
      const form = page.getByRole('dialog', { name: '编辑链接' });
      await expect(form.getByLabel('链接显示文本')).toHaveValue('middle');
      await form.getByLabel('链接地址').fill('https://example.com');
      if (externalUpdate) {
        await setMarkdown(page, 'Prefix\n\nBefore middle after');
        await expect(form).toBeVisible();
        await expect(form.getByLabel('链接地址')).toBeFocused();
      }
      await form.getByRole('button', { name: '保存' }).click();
      const prefix = externalUpdate ? 'Prefix\n\n' : '';
      await expect.poll(() => markdown(page)).toBe(`${prefix}Before [middle](https://example.com) after`);
      await page.keyboard.press('ControlOrMeta+z');
      await expect.poll(() => markdown(page)).toBe(`${prefix}Before middle after`);
    });
  }
}

test('link shortcut after collapsing a selection does not edit stale selected text', async ({ page }) => {
  await setMarkdown(page, 'Selected text\n\nOther paragraph');
  await page.locator('.ProseMirror > p').first().click({ clickCount: 3 });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe('Selected text');
  await page.locator('.ProseMirror > p').last().click();
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog', { name: '编辑链接' })).toBeHidden();
  expect(await markdown(page)).toBe('Selected text\n\nOther paragraph');
});

test('external link replacement closes a stale form and edits the replacement', async ({ page }) => {
  await setMarkdown(page, '[old](https://old.example)');
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://unsaved.example');

  await setMarkdown(page, 'New paragraph\n\n[new](https://new.example)');
  await expect(form).toBeHidden();
  expect(await markdown(page)).toBe('New paragraph\n\n[new](https://new.example)');

  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  await expect(form.getByLabel('链接地址')).toHaveValue('https://new.example');
  await form.getByLabel('链接地址').fill('https://edited.example');
  await form.getByRole('button', { name: '保存' }).click();
  await expect.poll(() => markdown(page)).toBe('New paragraph\n\n[new](https://edited.example)');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe('New paragraph\n\n[new](https://new.example)');
});

test('an external target change closes the stale link form without overwriting it', async ({ page }) => {
  await setMarkdown(page, '[link](https://example.com){target=_blank}');
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://unsaved.example');
  await setMarkdown(page, '[link](https://example.com){target=self}');
  await expect(form).toBeHidden();
  expect(await markdown(page)).toBe('[link](https://example.com){target=self}');
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  await expect(form.getByLabel('链接打开方式')).toHaveValue('self');
  await expect(form.getByLabel('链接地址')).toHaveValue('https://example.com');
});

test('an ambiguous duplicate link insertion cannot redirect an open form', async ({ page }) => {
  const link = '[link](https://example.com)';
  await setMarkdown(page, `${link}\n\n${link}`);
  await page.locator('.ProseMirror a').last().click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://unsaved.example');
  await setMarkdown(page, `${link}\n\n${link}\n\n${link}`);
  await expect(form).toBeHidden();
  expect(await markdown(page)).toBe(`${link}\n\n${link}\n\n${link}`);
});

test('an ambiguous duplicate link deletion cannot redirect an open form', async ({ page }) => {
  const link = '[link](https://example.com)';
  await setMarkdown(page, `${link}\n\n${link}\n\n${link}`);
  await page.mouse.click(8, page.viewportSize()!.height - 8);
  await page.locator('.ProseMirror a').nth(1).click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://unsaved.example');
  await setMarkdown(page, `${link}\n\n${link}`);
  await expect(form).toBeHidden();
  expect(await markdown(page)).toBe(`${link}\n\n${link}`);
});

test('formatted link edits survive an unrelated external change', async ({ page }) => {
  const link = '[plain **bold**](https://example.com)';
  await setMarkdown(page, `${link}\n\nTail`);
  await page.locator('.ProseMirror strong a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '编辑链接' }).click();
  const form = page.getByRole('dialog', { name: '编辑链接' });
  await form.getByLabel('链接地址').fill('https://edited.example');
  await setMarkdown(page, `Prefix\n\n${link}\n\nTail`);
  await expect(form).toBeVisible();
  await expect(form.getByLabel('链接地址')).toHaveValue('https://edited.example');
  await form.getByRole('button', { name: '保存' }).click();
  await expect.poll(() => markdown(page)).toBe('Prefix\n\n[plain **bold**](https://edited.example)\n\nTail');
});

test('typed and imported Cherry extensions share their grammar and retain undo', async ({ page }) => {
  for (const [source, type, text] of [
    ['!!red red!!', 'cherry_color', 'red'],
    ['!!!yellow background!!!', 'cherry_background_color', 'background'],
    ['!24 size!', 'cherry_font_size', 'size'],
    ['^^sub^^', 'cherry_subscript', 'sub'],
    ['^sup^', 'cherry_superscript', 'sup'],
    ['{汉|han}', 'cherry_ruby', '汉han'],
    ['/underline/', 'cherry_underline', 'underline'],
    ['==highlight==', 'cherry_highlight', 'highlight'],
  ]) {
    await setMarkdown(page, source);
    const mark = page.locator(`.ProseMirror [data-cherry-mark="${type}"]`);
    await expect(mark).toHaveText(text);
    await setMarkdown(page, '');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type(source);
    await expect(mark).toHaveText(text);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(mark).toHaveCount(0);
  }
});

test('Cherry code languages keep live highlighting, undo and existing controls', async ({ page }) => {
  const block = page.locator('.cherry-milkdown-code-block');
  for (const [language, source, type, text] of [
    ['typescript', 'const answer: number = 42;', 'builtin', 'number'],
    ['json', '{"answer":42}', 'property', '"answer"'],
    ['python', 'print("hello")', 'keyword', 'print'],
  ]) {
    await setMarkdown(page, `\`\`\`${language}\n${source}\n\`\`\``);
    await expect(block.locator(`.token.${type}`).filter({ hasText: text })).toHaveCount(1);
  }
  const original = await markdown(page);
  const content = block.locator('code');
  await content.click();
  await page.keyboard.press('End');
  await page.keyboard.type('\nreturn True');
  await expect(block.locator('.token.keyword').filter({ hasText: 'return' })).toHaveCount(1);
  expect(await markdown(page)).toContain('return True');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(original);
  const node = await block.elementHandle();
  await page.evaluate(() => window.milkdownEditor!.setTheme('dark'));
  expect(await node!.evaluate((element) => element.isConnected)).toBe(true);
  expect(await markdown(page)).toBe(original);
  await expect(block.getByRole('button', { name: '复制代码' })).toBeVisible();
  await block.getByRole('combobox', { name: '代码语言' }).selectOption('javascript');
  await expect(block.locator('.token.function').filter({ hasText: 'print' })).toHaveCount(1);
  expect(await content.textContent()).toBe('print("hello")');
});
