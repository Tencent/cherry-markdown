import assert from 'node:assert/strict';

/** Exercise actual Chromium clipboard behavior against the installed package. */
export async function checkConsumerClipboard(page, editorKey = 'consumerEditor') {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate((key) => window[key].setMarkdown('Left right'), editorKey);
  await page.evaluate(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob(['Bold link '], { type: 'text/plain' }),
        'text/html': new Blob(['<strong>Bold</strong> <a href="https://example.com/">link</a> '], {
          type: 'text/html',
        }),
      }),
    ]),
  );
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  for (let count = 0; count < 5; count += 1) await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => {
    const selection = window.getSelection();
    return selection?.anchorNode?.textContent === 'Left right' && selection.anchorOffset === 5;
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.keyboard.press('ControlOrMeta+v');
  await page.waitForFunction(() => document.querySelector('.ProseMirror > p')?.textContent === 'Left Bold link right');
  assert.equal(await paragraph.locator('strong').textContent(), 'Bold');
  assert.equal(await paragraph.locator('a').getAttribute('href'), 'https://example.com/');
  const saved = await page.evaluate((key) => window[key].getMarkdown(), editorKey);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === 'Left right', editorKey);
  await page.evaluate(({ key, markdown }) => window[key].setMarkdown(markdown), { key: editorKey, markdown: saved });
  await page.waitForFunction(() => document.querySelector('.ProseMirror > p')?.textContent === 'Left Bold link right');
  assert.equal(await paragraph.locator('strong').textContent(), 'Bold');
  assert.equal(await paragraph.locator('a').getAttribute('href'), 'https://example.com/');

  await page.evaluate((key) => window[key].setMarkdown('**BeforeAfter**'), editorKey);
  await page.evaluate(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([' middle '], { type: 'text/plain' }),
        'text/html': new Blob([' <span>middle</span> '], { type: 'text/html' }),
      }),
    ]),
  );
  const bold = paragraph.locator('strong');
  await bold.click();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await bold.evaluate((element) => {
    const range = document.createRange();
    range.setStart(element.firstChild, 6);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => window.getSelection()?.anchorOffset === 6);
  await page.keyboard.press('ControlOrMeta+v');
  await page.waitForFunction(
    () => document.querySelector('.ProseMirror > p strong')?.textContent === 'Before middle After',
  );
  await page.waitForFunction((key) => window[key].getMarkdown() === '**Before middle After**', editorKey);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === '**BeforeAfter**', editorKey);

  await page.evaluate(() => navigator.clipboard.writeText(' middle '));
  await bold.click();
  await bold.evaluate((element) => {
    const range = document.createRange();
    range.setStart(element.firstChild, 6);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.keyboard.press('ControlOrMeta+v');
  await page.waitForFunction((key) => window[key].getMarkdown() === '**Before middle After**', editorKey);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === '**BeforeAfter**', editorKey);
  await bold.click();
  await bold.evaluate((element) => {
    const range = document.createRange();
    range.setStart(element.firstChild, 6);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.keyboard.type('X');
  await page.keyboard.press('ControlOrMeta+v');
  await page.keyboard.type('Y');
  await page.waitForFunction((key) => window[key].getMarkdown() === '**BeforeX middle YAfter**', editorKey);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === '**BeforeX middle After**', editorKey);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === '**BeforeXAfter**', editorKey);
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === '**BeforeAfter**', editorKey);

  await page.evaluate((key) => window[key].setMarkdown('BeforeAfter'), editorKey);
  await page.evaluate(() => navigator.clipboard.writeText(' **bold** '));
  await paragraph.click();
  await paragraph.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode() && walker.currentNode.textContent !== 'BeforeAfter') {
      /* Find the document text. */
    }
    const range = document.createRange();
    range.setStart(walker.currentNode, 6);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.keyboard.press('ControlOrMeta+v');
  await page.waitForFunction(() => document.querySelector('.ProseMirror > p')?.textContent === 'Before bold After');
  assert.equal(await paragraph.locator('strong').textContent(), 'bold');
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === 'BeforeAfter', editorKey);

  await page.evaluate((key) => window[key].setMarkdown('BeforeXXX\n\nYYYAfter'), editorKey);
  await page.evaluate(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([' middle '], { type: 'text/plain' }),
        'text/html': new Blob([' <em>middle</em> '], { type: 'text/html' }),
      }),
    ]),
  );
  const editor = page.locator('.ProseMirror');
  await editor.locator('p').first().click();
  await editor.evaluate((element) => {
    const paragraphs = element.querySelectorAll('p');
    const findText = (parent, expected) => {
      const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) if (walker.currentNode.textContent === expected) return walker.currentNode;
      throw new Error('Missing paragraph text');
    };
    const range = document.createRange();
    range.setStart(findText(paragraphs[0], 'BeforeXXX'), 6);
    range.setEnd(findText(paragraphs[1], 'YYYAfter'), 3);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.keyboard.press('ControlOrMeta+v');
  await page.waitForFunction(() => document.querySelector('.ProseMirror > p')?.textContent === 'Before middle After');
  assert.equal(await paragraph.locator('em').textContent(), 'middle');
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction((key) => window[key].getMarkdown() === 'BeforeXXX\n\nYYYAfter', editorKey);
}
