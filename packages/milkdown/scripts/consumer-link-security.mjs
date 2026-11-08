import assert from 'node:assert/strict';

/** Check imported link actions against the installed package. */
export async function checkConsumerLinkSecurity(page) {
  await page.evaluate(() => window.consumerEditor.setMarkdown('[unsafe](javascript:alert%281%29)'));
  await page.locator('.ProseMirror a').click();
  const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
  const open = toolbar.locator('.cherry-milkdown-link-bubble__href');
  await open.waitFor();
  assert.equal(await open.getAttribute('href'), null);
  assert.equal(await open.getAttribute('aria-disabled'), 'true');
  await page.keyboard.press('Alt+F10');
  assert.equal(
    await toolbar.getByRole('button', { name: '复制链接' }).evaluate((button) => document.activeElement === button),
    true,
  );
  await toolbar.getByRole('button', { name: '编辑链接' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑链接' });
  await dialog.getByLabel('链接地址').fill('https://example.com/safe');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await page.locator('.ProseMirror a').click();
  await page.waitForFunction(
    () =>
      document.querySelector('.cherry-milkdown-link-bubble__href')?.getAttribute('href') === 'https://example.com/safe',
  );

  await page.evaluate(() =>
    window.consumerEditor.setMarkdown('[safe](https://example.com/safe)\n\nGap\n\n[unsafe](javascript:alert%281%29)'),
  );
  await page.locator('.ProseMirror a').last().click();
  await page.waitForFunction(
    () => document.querySelector('.cherry-milkdown-link-bubble__href')?.getAttribute('aria-disabled') === 'true',
  );
  assert.equal(await open.getAttribute('href'), null);
  assert.equal(await open.getAttribute('aria-disabled'), 'true');
  await page.locator('.ProseMirror a').first().click();
  await page.waitForFunction(
    () =>
      document.querySelector('.cherry-milkdown-link-bubble__href')?.getAttribute('href') === 'https://example.com/safe',
  );
  assert.equal(await open.getAttribute('href'), 'https://example.com/safe');
  assert.equal(await open.getAttribute('aria-disabled'), null);
  const immediate = await page.evaluate(() => {
    window.consumerEditor.setMarkdown('[safe](javascript:alert%281%29)');
    const bubble = document.querySelector('.cherry-milkdown-link-bubble');
    return !bubble || bubble.hidden || !bubble.querySelector('a')?.hasAttribute('href');
  });
  assert.equal(immediate, true, 'External replacement must immediately remove the stale link');

  await page.evaluate(() => window.createConsumerNested());
  try {
    await page.evaluate(() => window.consumerNestedEditor.setMarkdown('[nested](https://example.com/nested)'));
    const nested = page.locator('.consumer-nested-test');
    await nested.locator('.ProseMirror a').click();
    const nestedLink = nested.getByRole('toolbar', { name: '链接', exact: true }).getByRole('link');
    assert.equal(await nestedLink.getAttribute('href'), 'https://example.com/nested');
    await page.locator('.ProseMirror').first().locator('a').click();
    await page.waitForFunction(
      () => document.querySelector('.cherry-milkdown-link-bubble__href')?.getAttribute('aria-disabled') === 'true',
    );
    assert.equal(await open.getAttribute('href'), null);
    await page.evaluate(() => window.consumerNestedEditor.destroy());
    const mainOpen = page.locator('.cherry-milkdown').first().locator('.cherry-milkdown-link-bubble__href');
    assert.equal(await mainOpen.getAttribute('href'), null);
    await page
      .locator('.ProseMirror')
      .first()
      .locator('a')
      .click({ position: { x: 2, y: 2 } });
    await toolbar.waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await open.getAttribute('href'), null);
  } finally {
    await page.evaluate(async () => {
      await window.consumerNestedEditor?.destroy();
      document.querySelector('.consumer-nested-test')?.remove();
      delete window.consumerNestedEditor;
    });
  }
}
