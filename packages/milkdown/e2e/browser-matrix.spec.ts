import { expect, test } from '@playwright/test';

test('core preview editing remains synchronized across Firefox and WebKit', async ({ page }) => {
  await page.goto('/index.html');
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
  const blocks = editor.locator('p[data-cherry-drag-node]');
  await expect(blocks).toHaveCount(2);
  await blocks.nth(0).dragTo(blocks.nth(1));
  await expect.poll(async () =>
    page.evaluate(() => (window as typeof window & { cherry: { getMarkdown(): string } }).cherry.getMarkdown().trim()),
  ).toBe('Second\n\nFirst');
});
