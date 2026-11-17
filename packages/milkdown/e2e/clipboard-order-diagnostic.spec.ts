import { test, expect, setMarkdown } from './fixtures';

test('consecutive native link copies keep the latest value', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '[First](https://first.example)\n\nSpacer\n\n[Second](https://second.example)');
  const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
  await page.locator('.ProseMirror a').first().click();
  await toolbar.getByRole('button', { name: '复制链接' }).click();
  await page.locator('.ProseMirror a').last().click();
  await toolbar.getByRole('button', { name: '复制链接' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('https://second.example');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://second.example');
});

for (const firstTarget of ['link', 'code'] as const) {
  test(`consecutive native ${firstTarget} and ${firstTarget === 'link' ? 'code' : 'link'} copies keep the latest value`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This check uses Chromium clipboard permissions.');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await setMarkdown(page, '[Link](https://example.com)\n\n```js\nconst value = 1;\n```');
    const copyLink = async () => {
      await page.locator('.ProseMirror a').click();
      await page.getByRole('toolbar', { name: '链接', exact: true }).getByRole('button', { name: '复制链接' }).click();
    };
    const code = page.locator('.cherry-milkdown-code-block');
    const codeText = (await code.locator('code').textContent())!;
    const copyCode = () => code.getByRole('button', { name: '复制代码' }).click();
    if (firstTarget === 'link') {
      await copyLink();
      await copyCode();
    } else {
      await copyCode();
      await copyLink();
    }
    const expected = firstTarget === 'link' ? codeText : 'https://example.com';
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  });
}

test('a delayed native clipboard item does not overwrite a newer copy', async ({ page, browserName }) => {
  test.skip(
    process.env.MILKDOWN_CLIPBOARD_DIAGNOSTICS !== '1',
    'Opt-in diagnostic for delayed browser clipboard data.',
  );
  test.skip(browserName !== 'chromium', 'This diagnostic uses Chromium clipboard permissions.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  // Production passes an immediately available Blob. This diagnostic delays
  // the first item's data to exercise a possible out-of-order native commit.
  await page.evaluate(() => {
    const Original = window.ClipboardItem;
    let first = true;
    window.ClipboardItem = class extends Original {
      constructor(items: ConstructorParameters<typeof Original>[0]) {
        if (first) {
          first = false;
          const data = items['text/plain'];
          super({
            'text/plain': new Promise<Blob | string>((resolve) => {
              (window as Window & { finishFirst?: () => void }).finishFirst = () => resolve(data);
            }),
          });
        } else super(items);
      }
    };
  });
  await setMarkdown(page, '[First](https://first.example)\n\nSpacer\n\n[Second](https://second.example)');
  const toolbar = page.getByRole('toolbar', { name: '链接', exact: true });
  await page.locator('.ProseMirror a').first().click();
  await toolbar.getByRole('button', { name: '复制链接' }).click();
  await page.waitForFunction(() => Boolean((window as Window & { finishFirst?: () => void }).finishFirst));
  await page.locator('.ProseMirror a').last().click();
  await toolbar.getByRole('button', { name: '复制链接' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('https://second.example');
  await page.evaluate(() => (window as Window & { finishFirst?: () => void }).finishFirst?.());
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://second.example');
});
