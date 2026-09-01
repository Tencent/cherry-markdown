import { expect, test } from '@playwright/test';

test('core preview editing remains synchronized across Firefox and WebKit', async ({ page }) => {
  // The Chromium reliability suite exercises the full manual. Cross-engine
  // smoke tests use the same React/Cherry integration on the lightweight
  // preview-only route so Firefox/WebKit are not blocked by the manual's
  // hundreds of lazy diagram assets.
  await page.goto('/preview-only.html?matrix=1', { waitUntil: 'commit' }).catch(async (error) => {
    // Firefox can report a same-document second navigation while the React
    // entry is being committed. Continue only when the requested document is
    // already active; any other navigation failure remains a hard error.
    if (!page.url().includes('/preview-only.html')) throw error;
  });
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('# Matrix heading\n\nPlain text');
  });
  const editor = page.locator('.ProseMirror');
  await expect(editor.locator('h1')).toHaveText('Matrix heading');
  await editor.locator('h1').click();
  await page.keyboard.press('End');
  await page.keyboard.insertText(' edited');
  await expect.poll(async () =>
    page.evaluate(() => (window as typeof window & { cherry: { getMarkdown(): string } }).cherry.getMarkdown()),
  ).toContain('# Matrix heading edited');

  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('First\n\nSecond');
  });
  const blocks = editor.locator('p');
  await expect(blocks).toHaveCount(2);
  await blocks.nth(0).dragTo(blocks.nth(1));
  await expect.poll(async () =>
    page.evaluate(() => (window as typeof window & { cherry: { getMarkdown(): string } }).cherry.getMarkdown().trim()),
  ).toBe('Second\n\nFirst');
});
