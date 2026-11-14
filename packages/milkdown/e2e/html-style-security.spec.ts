import { expect, test } from '@playwright/test';

test('authored HTML cannot load a CSS URL hidden with escapes', async ({ page }) => {
  const requests: string[] = [];
  await page.route('https://example.com/css-probe', async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 204 });
  });
  await page.goto('/upload-harness.html?html-style-probe');
  expect(
    await page.evaluate(() => {
      const element = document.createElement('span');
      element.setAttribute('style', 'background:u\\72l(https://example.com/css-probe)');
      return element.style.background;
    }),
  ).toContain('https://example.com/css-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const preview = page.locator('.cherry-embed--cherry_html_block .cherry-embed__preview span').first();
  await expect(preview).toHaveText('Text');
  await expect(preview).toHaveCSS('background-image', 'none');
  await expect(page.locator('.cherry-embed--cherry_html_block .cherry-embed__preview span').last()).toHaveCSS(
    'color',
    'rgb(255, 0, 0)',
  );
  expect(requests).toEqual([]);
});

for (const probe of ['engine-style-probe', 'engine-variable-probe', 'engine-image-set']) {
  test(`custom Engine image output blocks CSS network requests: ${probe}`, async ({ page }) => {
    const requests: string[] = [];
    await page.route('https://example.com/css-probe', async (route) => {
      requests.push(route.request().url());
      await route.fulfill({ status: 204 });
    });
    await page.goto(`/upload-harness.html?${probe}`);
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const image = page.locator('.ProseMirror img[alt="original"]');
    await expect(image).toBeVisible();
    await expect(image).toHaveCSS('background-image', 'none');
    expect(requests).toEqual([]);
  });
}

test('custom Engine image output retains safe CSS variables', async ({ page }) => {
  await page.goto('/upload-harness.html?engine-safe-variable');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img[alt="original"]');
  await expect(image).toBeVisible();
  await expect(image).toHaveCSS('background-color', 'rgb(102, 51, 153)');
  await expect(image).toHaveAttribute('style', /width:\s*42px/);
});

test('read-only Engine output does not make data URLs clickable', async ({ page }) => {
  await page.goto('/upload-harness.html?readonly');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.uploadEditor!.engine.makeHtml = () =>
      '<a data-probe target="_blank" href="data:image/svg+xml,%3Csvg%3E">probe</a>' +
      '<img data-image src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">';
    window.uploadEditor!.setMarkdown(':smile:');
  });
  const preview = page.locator('.cherry-embed--cherry_emoji');
  const link = preview.locator('[data-probe]');
  await expect(link).toHaveText('probe');
  await expect(link).not.toHaveAttribute('href');
  const image = preview.locator('[data-image]');
  await expect(image).toHaveAttribute('src', /^data:image\/gif;base64,/);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(1);
  const popups: string[] = [];
  page.on('popup', (popup) => popups.push(popup.url()));
  await link.click();
  await page.waitForTimeout(250);
  expect(popups).toEqual([]);
});
