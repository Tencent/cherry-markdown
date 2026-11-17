import assert from 'node:assert/strict';

/** A nested renderer may synchronously replace the document without starting stale siblings. */
export async function checkConsumerNestedReentrant(page) {
  const chart = (title) => [`| :line:{"title":"${title}"} | Jan |`, '| --- | --- |', '| Sales | 1 |'].join('\n');
  const value = ['::: 2cols', chart('First'), '::', chart('Second'), ':::'].join('\n');
  await page.evaluate(() => window.createConsumerNested());
  try {
    await page.evaluate((value) => {
      window.consumerNestedCalls = [];
      window.consumerNestedReenter = true;
      window.consumerNestedEditor.setMarkdown(value, { emit: false });
    }, value);
    await page.waitForFunction(() => window.consumerNestedEditor.getMarkdown() === 'Replacement');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.deepEqual(await page.evaluate(() => window.consumerNestedCalls), [false]);
    assert.equal(await page.locator('.consumer-nested-test .ProseMirror').textContent(), 'Replacement');
  } finally {
    await page.evaluate(async () => {
      await window.consumerNestedEditor?.destroy();
      document.querySelector('.consumer-nested-test')?.remove();
      delete window.consumerNestedEditor;
    });
  }
}

/** Destruction requested by one renderer must stop its unstarted siblings. */
export async function checkConsumerNestedDestroy(page) {
  const chart = (title) => [`| :line:{"title":"${title}"} | Jan |`, '| --- | --- |', '| Sales | 1 |'].join('\n');
  const value = ['::: 2cols', chart('First'), '::', chart('Second'), ':::'].join('\n');
  await page.evaluate(() => window.createConsumerNested());
  try {
    await page.evaluate((value) => {
      window.consumerNestedCalls = [];
      window.consumerNestedCleanups = 0;
      window.consumerNestedDestroyed = false;
      window.consumerNestedDestroy = true;
      window.consumerNestedReenter = true;
      window.consumerNestedEditor.setMarkdown(value, { emit: false });
    }, value);
    await page.waitForFunction(() => window.consumerNestedDestroyed);
    assert.deepEqual(await page.evaluate(() => window.consumerNestedCalls), [false]);
    assert.equal(await page.evaluate(() => window.consumerNestedCleanups), 1);
    assert.equal(await page.locator('.consumer-nested-test .ProseMirror').count(), 0);
  } finally {
    await page.evaluate(async () => {
      await window.consumerNestedEditor?.destroy();
      document.querySelector('.consumer-nested-test')?.remove();
      delete window.consumerNestedEditor;
      window.consumerNestedDestroy = false;
    });
  }
}
