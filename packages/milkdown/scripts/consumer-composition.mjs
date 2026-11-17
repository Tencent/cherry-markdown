import assert from 'node:assert/strict';

/** Check native composition and an external prepend against the installed package. */
export async function checkConsumerComposition(page, editorKey = 'consumerEditor') {
  for (const ending of ['\n', '\r\n']) {
    const original = [':::warning Notice', '开始：结束', ':::'].join(ending) + (ending === '\r\n' ? ending : '');
    const external = `远程${ending}${ending}${original}`;
    await page.evaluate(({ key, original }) => window[key].setMarkdown(original), { key: editorKey, original });
    const paragraph = page.locator('.cherry-panel--body p');
    await paragraph.click();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await paragraph.evaluate((element) => {
      const text = [...element.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent === '开始：结束',
      );
      if (!text) throw new Error('Missing consumer composition text');
      const range = document.createRange();
      range.setStart(text, 3);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(
      () =>
        window.getSelection()?.anchorNode?.textContent === '开始：结束' && window.getSelection()?.anchorOffset === 3,
    );
    const input = await page.context().newCDPSession(page);
    try {
      await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
      await page.waitForFunction(() => document.querySelector('.cherry-panel--body p')?.textContent === '开始：ni结束');
      await page.evaluate(({ key, external }) => window[key].setMarkdown(external, { emit: false }), {
        key: editorKey,
        external,
      });
      await input.send('Input.insertText', { text: '你好' });
      const expected = external.replace('开始：结束', '开始：你好结束');
      await page.waitForFunction(({ key, expected }) => window[key].getMarkdown() === expected, {
        key: editorKey,
        expected,
      });
      await page.keyboard.press('ControlOrMeta+z');
      await page.waitForFunction(({ key, external }) => window[key].getMarkdown() === external, {
        key: editorKey,
        external,
      });
      await page.keyboard.press('ControlOrMeta+Shift+z');
      await page.waitForFunction(({ key, expected }) => window[key].getMarkdown() === expected, {
        key: editorKey,
        expected,
      });
      assert.equal(await paragraph.textContent(), '开始：你好结束');
    } finally {
      await input.detach();
    }
  }
}
