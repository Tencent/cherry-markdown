import assert from 'node:assert/strict';

/** Exercise native Chromium composition next to an image in the installed editor. */
export async function checkConsumerImageComposition(page, editorKey = 'consumerEditor') {
  const imageUrl = 'https://example.com/original.png';
  const respond = (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    });
  await page.route(imageUrl, respond);
  const original = '前![original](https://example.com/original.png)后';
  try {
    for (const side of ['before', 'after', 'before-with-arrow']) {
      const expected = side === 'after' ? original.replace('后', '你好后') : original.replace('前', '前你好');
      await page.evaluate(({ key, original }) => window[key].setMarkdown(original), { key: editorKey, original });
      await page.locator('.ProseMirror').focus();
      await page
        .locator('.ProseMirror p')
        .first()
        .evaluate((paragraph, side) => {
          const value = side === 'after' ? '后' : '前';
          const text = [...paragraph.childNodes].find(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent === value,
          );
          if (!text) throw new Error(`Missing text ${side} image`);
          window.getSelection().collapse(text, side === 'after' ? 0 : value.length);
          document.dispatchEvent(new Event('selectionchange'));
        }, side);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const input = await page.context().newCDPSession(page);
      try {
        await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 5, selectionEnd: 5 });
        await page.waitForFunction(() => document.querySelector('.ProseMirror p')?.textContent.includes('nihao'));
        if (side === 'before-with-arrow') {
          await page.evaluate(() => {
            document.addEventListener(
              'keydown',
              (event) => {
                document.documentElement.dataset.consumerImeArrow = JSON.stringify({
                  composing: event.isComposing,
                  prevented: event.defaultPrevented,
                });
              },
              { capture: true, once: true },
            );
          });
          await page.keyboard.press('ArrowRight');
          const event = JSON.parse(await page.locator('html').getAttribute('data-consumer-ime-arrow'));
          assert.deepEqual(event, { composing: true, prevented: false });
          assert.equal(await page.locator('.ProseMirror img.ProseMirror-selectednode').count(), 0);
        }
        await input.send('Input.insertText', { text: '你好' });
        await page.waitForFunction(({ key, expected }) => window[key].getMarkdown() === expected, {
          key: editorKey,
          expected,
        });
        await page.keyboard.press('ControlOrMeta+z');
        await page.waitForFunction(({ key, original }) => window[key].getMarkdown() === original, {
          key: editorKey,
          original,
        });
        await page.keyboard.press('ControlOrMeta+Shift+z');
        await page.waitForFunction(({ key, expected }) => window[key].getMarkdown() === expected, {
          key: editorKey,
          expected,
        });
      } finally {
        await input.detach();
      }
    }
  } finally {
    await page.unroute(imageUrl, respond);
  }
}
