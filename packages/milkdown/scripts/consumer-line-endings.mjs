import assert from 'node:assert/strict';

/** Verify source line endings through real editing and browser undo/redo. */
export async function checkConsumerLineEndings(page, editorKey = 'consumerEditor') {
  for (const terminal of ['', '\r\n\r\n']) {
    const original = `First\r\n\r\nSecond${terminal}`;
    await page.evaluate(({ key, original }) => window[key].setMarkdown(original), { key: editorKey, original });
    const paragraph = page.locator('.ProseMirror > p').filter({ hasText: 'Second' });
    await paragraph.click();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await paragraph.evaluate((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode()) && text.textContent !== 'Second') {
        /* Find the editable text. */
      }
      if (!text) throw new Error('Missing consumer paragraph text');
      const range = document.createRange();
      range.setStart(text, 6);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(
      () => window.getSelection()?.anchorNode?.textContent === 'Second' && window.getSelection()?.anchorOffset === 6,
    );
    await page.keyboard.press('Enter');
    await page.keyboard.type('Third');
    await page.locator('.ProseMirror > p').filter({ hasText: 'Third' }).waitFor();
    const edited = await page.evaluate((key) => window[key].getMarkdown(), editorKey);
    assert.equal(edited.replace(/\r\n/g, '').includes('\n'), false, 'CRLF changed during editing');
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForFunction(({ key, original }) => window[key].getMarkdown() === original, {
      key: editorKey,
      original,
    });
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await page.waitForFunction(({ key, edited }) => window[key].getMarkdown() === edited, { key: editorKey, edited });
  }
}
