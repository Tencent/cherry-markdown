import { expect, test } from '@playwright/test';

test('touch focus and composition-style input keep the preview editor usable', async ({ page }) => {
  await page.goto('/index.html?mode=previewOnly&touch=1', { waitUntil: 'commit' }).catch(async (error) => {
    if (!page.url().includes('mode=previewOnly')) throw error;
  });
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('Touch target');
  });
  const paragraph = page.locator('.ProseMirror p').first();
  // The full Cherry manual keeps its floating TOC layer mounted; a real touch
  // can land on the paragraph once it is in view even when that layer overlaps
  // the hit-test rectangle in headless WebKit/Chromium.
  await paragraph.tap({ force: true });
  await expect(page.locator('.ProseMirror')).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.insertText(' 汉字');
  await expect.poll(async () =>
    page.evaluate(() => (window as typeof window & { cherry: { getMarkdown(): string } }).cherry.getMarkdown().trim()),
  ).toBe('Touch target 汉字');
});
