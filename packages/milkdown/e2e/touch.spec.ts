import { expect, test } from '@playwright/test';

test('touch focus and composition-style input keep the preview editor usable', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('Touch target');
  });
  const paragraph = page.locator('.ProseMirror p').first();
  await paragraph.tap();
  await expect(page.locator('.ProseMirror')).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.insertText(' 汉字');
  await expect.poll(async () =>
    page.evaluate(() => (window as typeof window & { cherry: { getMarkdown(): string } }).cherry.getMarkdown().trim()),
  ).toBe('Touch target 汉字');
});
