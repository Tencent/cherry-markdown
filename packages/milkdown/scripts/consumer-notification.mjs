import assert from 'node:assert/strict';

/** A silent same-value echo must not cancel a pending local edit notification. */
export async function checkConsumerNotification(page, editorKey = 'consumerEditor') {
  await page.evaluate((key) => {
    window[key].setMarkdown('Notification probe', { emit: false });
    window.consumerChanges = [];
  }, editorKey);
  const paragraph = page.locator('.ProseMirror > p').last();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type('x');
  await page.evaluate((key) => window[key].setMarkdown(window[key].getMarkdown(), { emit: false }), editorKey);
  await page.waitForFunction(() => window.consumerChanges.includes('Notification probex'));
  assert.equal(await page.evaluate((key) => window[key].getMarkdown(), editorKey), 'Notification probex');
}
