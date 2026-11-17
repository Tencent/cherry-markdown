import assert from 'node:assert/strict';

/** Refocus from the host and type in the paragraph actually clicked. */
export async function checkConsumerPointerCaret(page, editorKey = 'consumerEditor') {
  const original = 'First paragraph\n\nSecond paragraph';
  await page.evaluate(({ key, original }) => window[key].setMarkdown(original), { key: editorKey, original });
  const paragraphs = page.locator('.ProseMirror > p');
  await paragraphs.first().click();
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'consumer-refocus-input';
    Object.assign(input.style, { position: 'fixed', bottom: '10px', right: '10px' });
    document.body.append(input);
  });
  const hostInput = page.locator('#consumer-refocus-input');
  try {
    await hostInput.click();
    await paragraphs.nth(1).click();
    await page.keyboard.press('End');
    await page.keyboard.type(' added');
    await page.waitForFunction(
      () => document.querySelectorAll('.ProseMirror > p')[1]?.textContent === 'Second paragraph added',
    );
    assert.equal(await paragraphs.first().textContent(), 'First paragraph');
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForFunction(({ key, original }) => window[key].getMarkdown() === original, {
      key: editorKey,
      original,
    });

    const crossParagraph = 'BeforeXXX\n\nYYYAfter';
    for (let attempt = 0; attempt < 5; attempt++) {
      await page.evaluate(({ key, value }) => window[key].setMarkdown(value), {
        key: editorKey,
        value: crossParagraph,
      });
      await hostInput.click();
      await paragraphs.first().click();
      await page.keyboard.press('Home');
      for (let index = 0; index < 6; index++) await page.keyboard.press('ArrowRight');
      for (let index = 0; index < 7; index++) await page.keyboard.press('Shift+ArrowRight');
      assert.equal(await page.evaluate(() => window.getSelection()?.toString().replace(/\s/g, '')), 'XXXYYY');
      await page.keyboard.type(' middle ');
      await page.waitForFunction(({ key }) => window[key].getMarkdown() === 'Before middle After', { key: editorKey });
      await page.keyboard.press('ControlOrMeta+z');
      await page.waitForFunction(({ key, value }) => window[key].getMarkdown() === value, {
        key: editorKey,
        value: crossParagraph,
      });
    }
  } finally {
    await hostInput.evaluate((element) => element.remove());
  }
}
