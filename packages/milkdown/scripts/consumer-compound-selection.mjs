import assert from 'node:assert/strict';

/** Exercise native mouse selection and editing in an installed compound block. */
export async function checkConsumerCompoundSelection(page, editorKey = 'consumerEditor') {
  const original = ':::warning Notice\nPanel body selection\n:::';
  await page.evaluate(({ key, original }) => window[key].setMarkdown(original), { key: editorKey, original });
  const paragraph = page.locator('.cherry-panel--body p');
  await paragraph.waitFor({ state: 'visible' });
  const bounds = await paragraph.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return { left: rect.left, right: rect.right, y: (rect.top + rect.bottom) / 2 };
  });
  await page.mouse.move(bounds.left + 1, bounds.y);
  await page.mouse.down();
  await page.mouse.move(bounds.right + 2, bounds.y, { steps: 12 });
  await page.mouse.up();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(() => window.getSelection()?.toString()), 'Panel body selection');
  await page.keyboard.type('Replacement');
  await page.waitForFunction(() => document.querySelector('.cherry-panel--body p')?.textContent === 'Replacement');
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(({ key, original }) => window[key].getMarkdown() === original, {
    key: editorKey,
    original,
  });

  const multiple = ':::warning Notice\nFirst paragraph\n\nSecond paragraph\n:::';
  await page.evaluate(({ key, multiple }) => window[key].setMarkdown(multiple), { key: editorKey, multiple });
  const paragraphs = page.locator('.cherry-panel--body p');
  await paragraphs.nth(1).waitFor({ state: 'visible' });
  const point = async (index, edge) =>
    paragraphs.nth(index).evaluate((element, edge) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return { x: edge === 'start' ? rect.left + 1 : rect.right + 2, y: (rect.top + rect.bottom) / 2 };
    }, edge);
  const first = await point(0, 'start');
  const last = await point(1, 'end');
  await page.mouse.move(last.x, last.y);
  await page.mouse.down();
  await page.mouse.move(last.x - 30, last.y, { steps: 5 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.getByRole('toolbar', { name: '文本格式' }).isVisible(), false);
  await page.mouse.move(first.x, first.y, { steps: 12 });
  await page.mouse.up();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(
    await page.evaluate(() => window.getSelection()?.toString().replace(/\s/g, '')),
    'FirstparagraphSecondparagraph',
  );
  await page.keyboard.type('Replacement');
  await page.waitForFunction(() => document.querySelector('.cherry-panel--body')?.textContent === 'Replacement');
  await page.keyboard.press('ControlOrMeta+z');
  await page.waitForFunction(({ key, multiple }) => window[key].getMarkdown() === multiple, {
    key: editorKey,
    multiple,
  });
}
