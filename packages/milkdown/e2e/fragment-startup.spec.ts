import { test, expect } from './fixtures';

test('an invalid initial URL fragment does not crash editor startup', async ({ page }) => {
  await page.goto('/#%E0%A4%A');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  // The navigation plugin restores the hash asynchronously after creation.
  await page.waitForTimeout(500);
  await expect(page.locator('.ProseMirror')).toBeVisible();
});
