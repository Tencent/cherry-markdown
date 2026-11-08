import assert from 'node:assert/strict';

/** An intercepted fallback must not report success, and a later copy must work. */
export async function checkConsumerInterceptedCopy(page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(async () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const clipboard = navigator.clipboard;
    await clipboard.writeText('consumer-copy-sentinel');
    const intercept = (event) => event.stopImmediatePropagation();
    window.consumerRealClipboard = clipboard;
    window.restoreConsumerClipboard = () => {
      document.removeEventListener('copy', intercept, true);
      if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
      else delete navigator.clipboard;
    };
    window.releaseConsumerCopyIntercept = () => document.removeEventListener('copy', intercept, true);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    document.addEventListener('copy', intercept, true);
  });
  try {
    await page.evaluate(() => window.consumerEditor.setMarkdown('[link](https://example.com/clipboard)'));
    await page.locator('.ProseMirror a').click();
    const button = page.getByRole('toolbar', { name: '链接', exact: true }).locator('button').first();
    await button.click();
    await button.and(page.locator('[aria-label="复制失败"]')).waitFor();
    assert.notEqual(
      await page.evaluate(() => window.consumerRealClipboard.readText()),
      'https://example.com/clipboard',
    );
    await page.evaluate(() => window.releaseConsumerCopyIntercept());
    await button.click();
    await button.and(page.locator('[aria-label="已复制"]')).waitFor();
    assert.equal(await page.evaluate(() => window.consumerRealClipboard.readText()), 'https://example.com/clipboard');
    await button.and(page.locator('[aria-label="复制链接"]')).waitFor();
  } finally {
    await page.evaluate(() => {
      window.restoreConsumerClipboard();
      delete window.restoreConsumerClipboard;
      delete window.releaseConsumerCopyIntercept;
      delete window.consumerRealClipboard;
    });
  }
}

/** Check the actual clipboard fallback when the browser denies API access. */
export async function checkConsumerClipboardGetter(page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    window.consumerRealClipboard = navigator.clipboard;
    window.restoreConsumerClipboard = () => {
      if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
      else delete navigator.clipboard;
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      get() {
        throw new DOMException('Clipboard access denied', 'SecurityError');
      },
    });
  });
  try {
    await page.evaluate(() => window.consumerEditor.setMarkdown('[link](https://example.com/clipboard)'));
    await page.locator('.ProseMirror a').click();
    const button = page.getByRole('toolbar', { name: '链接', exact: true }).locator('button').first();
    await button.click();
    await page.waitForFunction(
      () => document.querySelector('.cherry-milkdown-link-bubble button')?.getAttribute('aria-label') === '已复制',
    );
    assert.equal(await page.evaluate(() => window.consumerRealClipboard.readText()), 'https://example.com/clipboard');
  } finally {
    await page.evaluate(() => {
      window.restoreConsumerClipboard();
      delete window.restoreConsumerClipboard;
      delete window.consumerRealClipboard;
    });
  }
}

/** Delay clipboard completion while changing the link or code being inspected. */
export async function checkConsumerCopyRace(page) {
  await page.evaluate(() => {
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const item = Object.getOwnPropertyDescriptor(window, 'ClipboardItem');
    window.restoreConsumerClipboard = () => {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
      else delete navigator.clipboard;
      if (item) Object.defineProperty(window, 'ClipboardItem', item);
      else delete window.ClipboardItem;
    };
    Object.defineProperty(window, 'ClipboardItem', { configurable: true, value: class {} });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write: () => new Promise((resolve) => (window.finishConsumerCopy = resolve)) },
    });
  });
  const finish = () =>
    page.evaluate(async () => {
      window.finishConsumerCopy();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  try {
    await page.evaluate(() =>
      window.consumerEditor.setMarkdown('[First](https://first.example)\n\nSpacer\n\n[Second](https://second.example)'),
    );
    await page.locator('.ProseMirror a').first().click();
    const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
    await toolbar.getByRole('button', { name: '复制链接' }).click();
    await page.waitForFunction(() => Boolean(window.finishConsumerCopy));
    await page.locator('.ProseMirror a').last().click();
    await page.waitForFunction(
      () =>
        document.querySelector('.cherry-milkdown-link-bubble__href')?.getAttribute('href') === 'https://second.example',
    );
    await finish();
    assert.equal(await toolbar.locator('button').first().getAttribute('aria-label'), '复制链接');

    await page.evaluate(() => window.consumerEditor.setMarkdown('```js\nconst value = 1;\n```'));
    const code = page.locator('.cherry-milkdown-code-block');
    const copy = code.getByRole('button', { name: '复制代码' });
    await copy.click();
    await code.locator('code').click();
    await page.keyboard.press('End');
    await page.keyboard.type('x');
    await page.waitForFunction(() =>
      document.querySelector('.cherry-milkdown-code-block code')?.textContent.includes('1;x'),
    );
    await finish();
    assert.equal(await copy.textContent(), '复制');
  } finally {
    await page.evaluate(() => {
      window.restoreConsumerClipboard();
      delete window.restoreConsumerClipboard;
      delete window.finishConsumerCopy;
    });
  }
}

/** Verify the installed package against the browser's real clipboard. */
export async function checkConsumerStaleFallback(page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const mode of ['link', 'keyboard']) {
    await page.evaluate(async () => {
      const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      const clipboard = navigator.clipboard;
      await clipboard.writeText('consumer-copy-sentinel');
      let first = true;
      window.restoreConsumerClipboard = () => {
        if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
        else delete navigator.clipboard;
      };
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: clipboard.readText.bind(clipboard),
          write(items) {
            if (!first) return clipboard.write(items);
            first = false;
            return new Promise(
              (_resolve, reject) => (window.rejectConsumerCopy = () => reject(new Error('late failure'))),
            );
          },
        },
      });
    });
    try {
      await page.evaluate(() =>
        window.consumerEditor.setMarkdown(
          '[First](https://first.example)\n\nKeyboard copy text\n\n[Second](https://second.example)',
        ),
      );
      const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
      await page.locator('.ProseMirror a').first().click();
      await toolbar.getByRole('button', { name: '复制链接' }).click();
      await page.waitForFunction(() => Boolean(window.rejectConsumerCopy));
      const expected = mode === 'link' ? 'https://second.example' : 'Keyboard copy text';
      if (mode === 'link') {
        await page.locator('.ProseMirror a').last().click();
        await toolbar.getByRole('button', { name: '复制链接' }).click();
      } else {
        const paragraph = page.locator('.ProseMirror p').filter({ hasText: expected });
        await paragraph.click();
        await paragraph.evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        });
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+C' : 'Control+C');
      }
      await page.waitForFunction(async (value) => (await navigator.clipboard.readText()) === value, expected);
      await page.evaluate(async () => {
        window.rejectConsumerCopy();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);
    } finally {
      await page.evaluate(() => {
        window.restoreConsumerClipboard();
        delete window.restoreConsumerClipboard;
        delete window.rejectConsumerCopy;
      });
    }
  }
}

/** Destroy the installed editor while its clipboard write is still pending. */
export async function checkConsumerCopyDestroy(page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    const clipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: clipboard.readText.bind(clipboard),
        writeText: clipboard.writeText.bind(clipboard),
        write: () =>
          new Promise((_resolve, reject) => (window.rejectConsumerCopy = () => reject(new Error('late failure')))),
      },
    });
  });
  await page.evaluate(() => window.consumerEditor.setMarkdown('[First](https://first.example)'));
  await page.locator('.ProseMirror a').click();
  await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '复制链接' }).click();
  await page.waitForFunction(() => Boolean(window.rejectConsumerCopy));
  await page.evaluate(async () => {
    await window.consumerEditor.destroy();
    await navigator.clipboard.writeText('new clipboard content');
    window.rejectConsumerCopy();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'new clipboard content');
}
