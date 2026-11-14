import { test, expect, markdown, setMarkdown } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

test('copy dragging an image keeps the original and can be undone', async ({ page }) => {
  const original = '![dog](assets/images/demo-dog.png)\n\nTarget paragraph.';
  await setMarkdown(page, original);
  const image = page.locator('.ProseMirror img[src]').first();
  const target = page.locator('.ProseMirror p').filter({ hasText: 'Target paragraph.' });
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
    .toBe(true);
  const box = await image.boundingBox();
  expect(box).not.toBeNull();
  const copyKey = process.platform === 'darwin' ? 'Alt' : 'Control';
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 12, box!.y + box!.height / 2 + 12, { steps: 4 });
  // Firefox uses Alt-before-mousedown for native selection; press it after drag start.
  await page.keyboard.down(copyKey);
  const targetBox = await target.boundingBox();
  expect(targetBox).not.toBeNull();
  await page.mouse.move(targetBox!.x + 60, targetBox!.y + targetBox!.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.keyboard.up(copyKey);
  await expect(page.locator('.ProseMirror img[src]')).toHaveCount(2);
  await expect(target.locator('img[src]')).toHaveCount(1);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await expect.poll(() => markdown(page)).toBe(original);
  await expect(page.locator('.ProseMirror img[src]')).toHaveCount(1);
});

test('dragging an image into another paragraph moves it once and supports undo', async ({ page }) => {
  const original = '![dog](assets/images/demo-dog.png)\n\nTarget paragraph.';
  await setMarkdown(page, original);
  const image = page.locator('.ProseMirror img').first();
  const target = page.locator('.ProseMirror p').filter({ hasText: 'Target paragraph.' });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
    .toBe(true);
  const imageBox = await image.boundingBox();
  const targetBox = await target.boundingBox();
  expect(imageBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  await page.mouse.move(imageBox!.x + imageBox!.width / 2, imageBox!.y + imageBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(imageBox!.x + imageBox!.width / 2 + 12, imageBox!.y + imageBox!.height / 2 + 12, { steps: 4 });
  const dropBox = await target.boundingBox();
  expect(dropBox).not.toBeNull();
  await page.mouse.move(dropBox!.x + 60, dropBox!.y + dropBox!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => markdown(page)).not.toBe(original);
  await expect(page.locator('.ProseMirror img[src]')).toHaveCount(1);
  await expect(target.locator('img[src]')).toHaveCount(1);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await expect.poll(() => markdown(page)).toBe(original);
  await expect(page.locator('.ProseMirror img[src]')).toHaveCount(1);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+Shift+z');
  await expect(target.locator('img[src]')).toHaveCount(1);
  await target.locator('img[src]').click();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeVisible();
});
