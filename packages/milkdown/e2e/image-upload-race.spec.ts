import { test, expect, colorContrast } from './fixtures';

test('unsafe image addresses are rejected without losing the original and can be corrected', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const before = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  const source = dialog.getByLabel('图片地址');
  await source.fill('data:text/html,unsafe');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(source).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByRole('status')).toHaveText('图片地址不安全，请修改。');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(before);
  await source.fill('https://example.com/updated.png');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('updated.png');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(before);
});

test('a non-string upload result reports failure and allows retry', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const before = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  const file = dialog.locator('input[type="file"]');
  await file.setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('bad') });
  const callbackError = await page.evaluate(() => {
    try {
      window.uploads[0]!.finish(null as unknown as string);
      return null;
    } catch (error) {
      return String(error);
    }
  });
  expect(callbackError).toBeNull();
  await expect(dialog.getByRole('status')).toHaveText('图片上传失败，请重试。');
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(before);
  await file.setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken') });
  const metadataError = await page.evaluate(() => {
    try {
      window.uploads[1]!.finish('https://example.com/broken.png', {
        get name(): string {
          throw new Error('Metadata unavailable');
        },
      });
      return null;
    } catch (error) {
      return String(error);
    }
  });
  expect(metadataError).toBeNull();
  await expect(dialog.getByRole('status')).toHaveText('图片上传失败，请重试。');
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(before);
  await dialog.getByLabel('图片替代文本').fill('');
  await file.setInputFiles({ name: 'retry.png', mimeType: 'image/png', buffer: Buffer.from('retry') });
  await page.evaluate(() => window.uploads[2]!.finish('https://example.com/retry.png', null as never));
  await expect(dialog.getByLabel('图片替代文本')).toHaveValue('retry');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('retry.png');
});

test('upload metadata cannot update the form after it destroys the editor', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'pending.png',
    mimeType: 'image/png',
    buffer: Buffer.from('pending'),
  });
  const result = await page.evaluate(async () => {
    const address = document.querySelector<HTMLInputElement>('.cherry-milkdown-image-source input[name="source"]')!;
    const before = address.value;
    let destruction: Promise<void> | undefined;
    window.uploads[0]!.finish('https://example.com/late.png', {
      get name() {
        destruction = window.uploadEditor!.destroy();
        return 'late';
      },
    });
    const after = address.value;
    if (!destruction) throw new Error('Metadata getter did not destroy the editor');
    await destruction;
    return { before, after, aborted: window.uploads[0]!.signal.aborted };
  });
  expect(result.after).toBe(result.before);
  expect(result.aborted).toBe(true);
});

test('malformed upload metadata cannot change the image name or decoration', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await dialog.getByLabel('图片替代文本').fill('');
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'upload.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test'),
  });
  await page.evaluate(() =>
    window.uploads[0]!.finish('https://example.com/upload.png', {
      name: {},
      width: {},
      isBorder: 'false',
    } as never),
  );
  await expect(dialog.getByLabel('图片替代文本')).toHaveValue('upload');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toContain('![upload](https://example.com/upload.png)');
});

test('valid upload metadata retains its name, dimensions, and decorations', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await dialog.getByLabel('图片替代文本').fill('');
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'upload.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test'),
  });
  await page.evaluate(() => {
    const params = {
      name: 'Custom',
      width: 123,
      height: '50%',
      isBorder: true,
      isShadow: true,
      isRadius: true,
    };
    window.uploads[0]!.finish('https://example.com/upload.png', params);
    params.width = 999;
    params.isBorder = false;
  });
  await expect(dialog.getByLabel('图片替代文本')).toHaveValue('Custom');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toContain('![Custom#123px#50%#B#S#R](https://example.com/upload.png)');
});

test('an unsafe upload result cannot be saved and the address can be corrected', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const before = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await dialog
    .locator('input[type="file"]')
    .setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('test') });
  await page.evaluate(() => window.uploads[0]!.finish('javascript:alert(1)'));
  await expect(dialog.getByLabel('图片地址')).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByRole('status')).toHaveText('图片地址不安全，请修改。');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect(dialog.getByLabel('图片地址')).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByRole('status')).toHaveText('图片地址不安全，请修改。');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(before);
  await dialog.getByLabel('图片地址').fill('https://example.com/updated.png');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('updated.png');
});

test('the image form accepts an image data URL and the change remains undoable', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const before = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  const src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  await dialog.getByLabel('图片地址').fill(src);
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.ProseMirror img[src]').first()).toHaveAttribute('src', src);
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain(src);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(before);
});

test('image edits survive viewport resizing and page scrolling on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 600 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await dialog.getByLabel('图片替代文本').fill('updated');
  await dialog.getByLabel('图片地址').fill('https://example.com/updated.png');
  await page.setViewportSize({ width: 320, height: 450 });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('图片地址')).toHaveValue('https://example.com/updated.png');
  await expect(dialog.getByLabel('图片地址')).toBeFocused();
  await page.evaluate(() => {
    document.body.style.minHeight = '1800px';
    window.scrollTo(0, 180);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('图片替代文本')).toHaveValue('updated');
  await expect(dialog.getByLabel('图片地址')).toBeFocused();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(450);
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('updated.png');
});

test('image form remains operable in a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 120 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await dialog.getByLabel('图片地址').fill('https://example.com/short.png');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('short.png');
});

test('an empty image address explains the error and can be corrected without losing edits', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 320 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  const address = dialog.getByLabel('图片地址');
  await dialog.getByLabel('图片替代文本').fill('updated');
  await address.fill('   ');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('请输入图片地址。');
  await expect(dialog.getByRole('status')).toBeInViewport();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(address).toHaveAttribute('aria-invalid', 'true');
  await expect(address).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await address.fill('https://example.com/corrected.png');
  await expect(address).not.toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByLabel('图片替代文本')).toHaveValue('updated');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toBe('![updated](https://example.com/corrected.png)');
});

test('viewport changes do not cancel an active image upload', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 600 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'upload.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test-image'),
  });
  await page.setViewportSize({ width: 320, height: 450 });
  await page.evaluate(() => {
    document.body.style.minHeight = '1800px';
    window.scrollTo(0, 180);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => window.uploads[0]!.signal.aborted)).toBe(false);
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/uploaded.png'));
  await expect(dialog.getByLabel('图片地址')).toHaveValue('https://example.com/uploaded.png');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('uploaded.png');
});

test('destroy preserves a just-applied edit while cancelling pending notifications', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const result = await page.evaluate(() => window.editAndDestroySynchronously());
  expect(result.immediate).toContain('draft');
  expect(result.after).toBe(result.immediate);
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

test('a serializer that reenters destroy shares the pending cleanup', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?delay-destroy');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const result = await page.evaluate(() => window.editAndDestroyReentrantly());
  expect(result.shared).toBe(true);
  expect(result.markdown).toContain('draft');
  await page.waitForFunction(() => Boolean(window.releaseEditorCleanup));
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
  await page.evaluate(async () => {
    window.releaseEditorCleanup!();
    await window.firstEditorDestroy;
  });
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

test('destroy snapshots an edit made during serialization', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const result = await page.evaluate(() => window.editDuringDestroySnapshot());
  expect(result).toContain('latest draft');
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

test('destroy during an external update retains its source formatting', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?destroy-external');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const result = await page.evaluate(async () => {
    window.uploadEditor!.setMarkdown('* Item\r\n\r\n');
    await window.firstEditorDestroy;
    return window.uploadEditor!.getMarkdown();
  });
  expect(result).toBe('* Item\r\n\r\n');
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

test('destroy during final external serialization retains source formatting', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  expect(await page.evaluate(() => window.destroyDuringExternalSerialization())).toBe('* Item\r\n\r\n');
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

test('failed plugin cleanup rejects both destroy callers and still tears down the view', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html?reject-destroy');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const results = await page.evaluate(async () => {
    const values = await Promise.allSettled([window.uploadEditor!.destroy(), window.uploadEditor!.destroy()]);
    return values.map((value) => (value.status === 'rejected' ? String(value.reason) : value.status));
  });
  expect(results).toEqual(['Error: Plugin cleanup failed', 'Error: Plugin cleanup failed']);
  expect(await page.evaluate(() => window.failedDestroyViewCleaned)).toBe(true);
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  await page.evaluate(async () => {
    window.uploadEditor = await window.retryUploadEditor();
  });
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
});

test('concurrent destroy waits for asynchronous cleanup before remounting', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html?delay-destroy');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.firstEditorDestroy = window.uploadEditor!.destroy();
    window.secondEditorDestroy = window.uploadEditor!.destroy().then(() => {
      window.secondEditorDestroyFinished = true;
    });
  });
  await page.waitForFunction(() => Boolean(window.releaseEditorCleanup));
  expect(await page.evaluate(() => Boolean(window.secondEditorDestroyFinished))).toBe(false);
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
  await page.evaluate(async () => {
    window.releaseEditorCleanup!();
    await Promise.all([window.firstEditorDestroy, window.secondEditorDestroy]);
  });
  expect(await page.evaluate(() => window.secondEditorDestroyFinished)).toBe(true);
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  await page.evaluate(async () => {
    window.uploadEditor = await window.retryUploadEditor();
  });
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
});

test('failed initialization cleans up plugins and preserves the host before a fresh mount', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html?fail-init');
  await page.waitForFunction(() => window.failedEditorRejected);
  expect(await page.evaluate(() => window.failedEditorCleaned)).toBe(true);
  expect(await page.evaluate(() => window.failedEditorError)).toContain('create: Error: Initial serialization failed');
  await expect(page.locator('#editor')).toHaveText('Host content');
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  await page.evaluate(async () => {
    window.uploadEditor = await window.retryUploadEditor();
  });
  await expect(page.locator('.ProseMirror')).toBeVisible();
  expect(await page.locator('#editor').textContent()).toContain('Host content');
});

test('pressing an image resize handle without moving does not change the document', async ({ page }, testInfo) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img[src]').first();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  if (testInfo.project.name === 'chromium-touch') {
    await image.tap();
    await handle.tap();
  } else {
    await image.click();
    await handle.click();
  }
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  if (testInfo.project.name === 'chromium-touch') {
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 20, y: start.y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [start] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await cdp.detach();
    }
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 20, start.y, { steps: 3 });
    await page.mouse.move(start.x, start.y, { steps: 3 });
    await page.mouse.up();
  }
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('touching an image opens its controls and a touch resize is undoable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-touch', 'Requires the Chromium touch-emulation project.');
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img[src]').first().tap();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeVisible();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 30, y: start.y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toMatch(/#\d+px/);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('a second finger cannot take over an active image resize', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-touch', 'Requires the Chromium touch-emulation project.');
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img[src]').first().tap();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const first = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2, id: 1 };
  const second = { x: first.x, y: first.y + 1, id: 2 };
  await page.evaluate(() => {
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (
          event.pointerType === 'touch' &&
          !event.isPrimary &&
          (event.target as Element).hasAttribute('data-resize-handle')
        ) {
          document.body.dataset.secondResizePointer = 'seen';
        }
      },
      { capture: true },
    );
  });
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
    await expect(page.locator('body')).toHaveAttribute('data-second-resize-pointer', 'seen');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [first] });
    expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...first, x: first.x + 30 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toMatch(/original#90px/);
});

test('external prepend during touch resize preserves both the resize and new text', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-touch', 'Requires the Chromium touch-emulation project.');
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().tap();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 30, y: start.y }] });
    await page.evaluate(() =>
      window.uploadEditor!.setMarkdown('New text\n\n![original](https://example.com/original.png)'),
    );
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toMatch(/original#\d+px/);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('New text');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toBe('New text\n\n![original](https://example.com/original.png)');
});

test('external image replacement during a touch resize is not overwritten', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-touch', 'Requires the Chromium touch-emulation project.');
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().tap();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const replacement = '![replacement](https://example.com/replacement.png)';
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 30, y: start.y }] });
    await page.evaluate((markdown) => window.uploadEditor!.setMarkdown(markdown), replacement);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(replacement);
  await expect(page.locator('.ProseMirror img[src]')).toHaveAttribute('src', 'https://example.com/replacement.png');
});

test('a cancelled touch resize restores the preview without changing Markdown', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-touch', 'Requires the Chromium touch-emulation project.');
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img[src]').first();
  await image.tap();
  const originalWidth = await image.evaluate((element: HTMLImageElement) => element.style.width);
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 30, y: start.y }] });
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.style.width)).not.toBe(originalWidth);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.style.width)).toBe(originalWidth);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('external prepend during mouse resize retains both changes', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img[src]').first().click();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y, { steps: 4 });
  await page.evaluate(() =>
    window.uploadEditor!.setMarkdown('New text\n\n![original](https://example.com/original.png)'),
  );
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toMatch(/original#\d+px/);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('New text');
});

test('dragging an image between editor instances preserves the source and inserts once', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    window.secondUploadEditor = await window.createUploadEditor();
    window.secondUploadEditor.setMarkdown('Destination paragraph.');
  });
  const source = page.locator('.ProseMirror').first();
  const destination = page.locator('.ProseMirror').nth(1);
  const image = source.locator('img[src]').first();
  const target = destination.locator('p').filter({ hasText: 'Destination paragraph.' });
  await expect(image).toBeVisible();
  const imageBox = await image.boundingBox();
  expect(imageBox).not.toBeNull();
  await page.mouse.move(imageBox!.x + imageBox!.width / 2, imageBox!.y + imageBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(imageBox!.x + imageBox!.width / 2 + 12, imageBox!.y + imageBox!.height / 2 + 12, { steps: 4 });
  const targetBox = await target.boundingBox();
  expect(targetBox).not.toBeNull();
  await page.mouse.move(targetBox!.x + 60, targetBox!.y + targetBox!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(target.locator('img[src]')).toHaveCount(1);
  await expect(source.locator('img[src]')).toHaveCount(1);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(
    '![original](https://example.com/original.png)',
  );
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await expect(target.locator('img[src]')).toHaveCount(0);
  await expect(source.locator('img[src]')).toHaveCount(1);
});

for (const active of ['first', 'second'] as const) {
  test(`updating and destroying another editor does not cancel an upload in the ${active} editor`, async ({ page }) => {
    await page.route('https://example.com/**', (route) =>
      route.fulfill({
        contentType: 'image/gif',
        body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
      }),
    );
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    await page.evaluate(async (active) => {
      window.secondUploadEditor = await window.createUploadEditor();
      const editors = document.querySelectorAll<HTMLElement>('.cherry-milkdown');
      editors[0]!.dataset.uploadOwner = 'first';
      editors[1]!.dataset.uploadOwner = 'second';
      const other = active === 'first' ? window.secondUploadEditor : window.uploadEditor!;
      other.setMarkdown('Other editor content', { emit: false });
    }, active);
    const owner = page.locator(`.cherry-milkdown[data-upload-owner="${active}"]`);
    await owner.locator('.ProseMirror img[alt="original"]').click();
    await owner.getByRole('button', { name: '编辑图片' }).click();
    const dialog = owner.getByRole('dialog', { name: '编辑图片' });
    await owner.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
      name: 'first.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test-image'),
    });
    await page.evaluate(async (active) => {
      const other = active === 'first' ? window.secondUploadEditor! : window.uploadEditor!;
      other.setMarkdown('Other editor updated', { emit: false });
      await other.destroy();
    }, active);
    expect(await page.evaluate(() => window.uploads[0]!.signal.aborted)).toBe(false);
    await expect(dialog).toBeVisible();
    await page.evaluate(() => window.uploads[0]!.finish('https://example.com/uploaded-first.png'));
    await expect(dialog.getByLabel('图片地址')).toHaveValue('https://example.com/uploaded-first.png');
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(
          (active) => (active === 'first' ? window.uploadEditor! : window.secondUploadEditor!).getMarkdown(),
          active,
        ),
      )
      .toContain('uploaded-first.png');
    await expect(page.locator('.cherry-milkdown')).toHaveCount(1);
  });
}

test('Escape outside the editor remains available to the host page', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'host-input';
    // Keep the host control outside the open image toolbar's footprint.
    input.style.display = 'block';
    input.style.marginTop = '180px';
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') input.dataset.prevented = String(event.defaultPrevented);
    });
    document.body.append(input);
  });
  await page.locator('#host-input').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#host-input')).toHaveAttribute('data-prevented', 'false');
  await page.locator('.ProseMirror img').first().click();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeVisible();
  await page.locator('#host-input').click();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeHidden();
  await page.evaluate(() => {
    const editor = window.uploadEditor!;
    editor.setMarkdown(`${editor.getMarkdown()}\n\nHost update`);
  });
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeHidden();
  await expect(page.locator('#host-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#host-input')).toHaveAttribute('data-prevented', 'false');
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await expect(page.getByRole('dialog', { name: '编辑图片' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '编辑图片' })).toBeHidden();
});

test('Escape from the image toolbar returns keyboard focus to the editor', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror img').first().click();
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  await expect(toolbar).toBeVisible();
  await page.locator('.ProseMirror').focus();
  await page.keyboard.press('Escape');
  await expect(toolbar).toBeHidden();
  await page.locator('.ProseMirror img').first().click();
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole('button', { name: '边框' }).focus();
  await page.keyboard.press('Escape');
  await expect(toolbar).toBeHidden();
  await expect(page.locator('.ProseMirror')).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('x');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(`${original}x`);
});

test('keyboard can select an image and enter its actions without changing the document', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = 'Text ![original](https://example.com/original.png)';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original);
  await page.keyboard.press('Tab');
  await expect(page.locator('.ProseMirror')).toBeFocused();
  for (const direction of ['ArrowRight', 'ArrowLeft']) {
    for (let step = 0; step < 'Text '.length + 2; step++) {
      if (await page.locator('.ProseMirror img.ProseMirror-selectednode').count()) break;
      await page.keyboard.press(direction);
    }
  }
  await expect(page.locator('.ProseMirror img.ProseMirror-selectednode')).toHaveCount(1);
  await page.keyboard.press('Alt+F10');
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  const border = toolbar.getByRole('button', { name: '边框' });
  await expect(border).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await page.keyboard.press('Escape');
  await expect(page.locator('.ProseMirror')).toBeFocused();
  await expect(toolbar).toBeHidden();
  await page.keyboard.press('Alt+F10');
  await expect(border).toBeFocused();
  await page.keyboard.press('Space');
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toBe('Text ![original#B](https://example.com/original.png)');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('leaving continuously moving image actions stops following the image', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.evaluate((element: HTMLElement) => (element.style.marginLeft = '300px'));
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(80px)' }], {
      duration: 2000,
      iterations: Infinity,
      direction: 'alternate',
    }),
  );
  await page.keyboard.press('Alt+F10');
  await expect(page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' })).toBeFocused();
  await page.keyboard.press('Escape');
  const toolbar = page.locator('.cherry-milkdown-image-controls');
  await expect(toolbar).toBeHidden();
  const left = await toolbar.evaluate((element: HTMLElement) => element.style.left);
  await page.waitForTimeout(300);
  expect(await toolbar.evaluate((element: HTMLElement) => element.style.left)).toBe(left);
  await expect(page.locator('.ProseMirror')).toBeFocused();
});

test('image keyboard actions remain reachable after scrolling the selected image out of view', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = `![original](https://example.com/original.png)\n\n${Array.from({ length: 60 }, (_, i) => `Paragraph ${i}`).join('\n\n')}`;
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original);
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1))).toBe(original);
  await page.evaluate(() => (window.uploadChanges.length = 0));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await expect(image).toHaveClass(/ProseMirror-selectednode/);
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await page.keyboard.press('Alt+F10');
  const border = page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' });
  await expect(border).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

test('Shift and arrow selection next to an image keeps normal text editing and undo', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = 'abc![original](https://example.com/original.png)';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original);
  await page.locator('.ProseMirror').focus();
  await page
    .locator('.ProseMirror p')
    .first()
    .evaluate((paragraph) => {
      const text = [...paragraph.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent === 'abc',
      );
      if (!text) throw new Error('Missing text before image');
      const selection = window.getSelection()!;
      selection.collapse(text, 3);
      document.dispatchEvent(new Event('selectionchange'));
    });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('c');
  await page.keyboard.type('X');
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toBe('abX![original](https://example.com/original.png)');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

for (const side of ['before', 'after'] as const) {
  test(`native Chromium composition ${side} an image preserves input and undo`, async ({ page }, info) => {
    test.skip(!['chromium', 'chromium-touch'].includes(info.project.name), 'Requires Chromium native input protocol.');
    await page.route('https://example.com/**', (route) =>
      route.fulfill({
        contentType: 'image/gif',
        body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
      }),
    );
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const original = '前![original](https://example.com/original.png)后';
    const expected = side === 'before' ? original.replace('前', '前你好') : original.replace('后', '你好后');
    await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original);
    await page.locator('.ProseMirror').focus();
    await page
      .locator('.ProseMirror p')
      .first()
      .evaluate((paragraph, side) => {
        const value = side === 'before' ? '前' : '后';
        const text = [...paragraph.childNodes].find(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent === value,
        );
        if (!text) throw new Error(`Missing ${side} image text`);
        window.getSelection()!.collapse(text, side === 'before' ? value.length : 0);
        document.dispatchEvent(new Event('selectionchange'));
      }, side);
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    const input = await page.context().newCDPSession(page);
    try {
      await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
      await expect(page.locator('.ProseMirror p').first()).toContainText('nihao');
      await input.send('Input.insertText', { text: '你好' });
      await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(expected);
      await expect(page.locator('.ProseMirror img[alt="original"]')).toHaveCount(1);
      await page.keyboard.press('ControlOrMeta+z');
      await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
      await page.keyboard.press('ControlOrMeta+Shift+z');
      await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(expected);
    } finally {
      await input.detach();
    }
  });
}

test('a composing arrow key next to an image is not taken by image selection', async ({ page }, info) => {
  test.skip(!['chromium', 'chromium-touch'].includes(info.project.name), 'Requires Chromium native input protocol.');
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = '前![original](https://example.com/original.png)后';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original);
  await page.locator('.ProseMirror').focus();
  await page
    .locator('.ProseMirror p')
    .first()
    .evaluate((paragraph) => {
      const text = [...paragraph.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent === '前',
      );
      if (!text) throw new Error('Missing text before image');
      window.getSelection()!.collapse(text, 1);
      document.dispatchEvent(new Event('selectionchange'));
    });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const input = await page.context().newCDPSession(page);
  try {
    await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
    await page.evaluate(() => {
      document.addEventListener(
        'keydown',
        (event) => {
          document.documentElement.dataset.imageImeKey = JSON.stringify({
            composing: event.isComposing,
            prevented: event.defaultPrevented,
          });
        },
        { capture: true, once: true },
      );
    });
    await page.keyboard.press('ArrowRight');
    const result = await page.locator('html').getAttribute('data-image-ime-key');
    expect(JSON.parse(result!)).toEqual({ composing: true, prevented: false });
    await expect(page.locator('.ProseMirror img.ProseMirror-selectednode')).toHaveCount(0);
    await input.send('Input.insertText', { text: '你' });
    await expect
      .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
      .toBe('前你![original](https://example.com/original.png)后');
    await expect(page.locator('.ProseMirror img[alt="original"]')).toHaveCount(1);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect
      .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
      .toBe('前你![original](https://example.com/original.png)后');
  } finally {
    await input.detach();
  }
});

test('Escape cancels a pending keyboard focus while an image is animating', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.99)' }], { duration: 400 }),
  );
  await page.keyboard.press('Alt+F10');
  await page.keyboard.press('Escape');
  await image.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeHidden();
  await expect(page.locator('.ProseMirror')).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('a continuously fading image keeps its controls and keyboard actions usable', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.evaluate((element) =>
    element.animate([{ opacity: 0.8 }, { opacity: 1 }], { duration: 400, iterations: Infinity }),
  );
  await image.click();
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  await expect(toolbar).toBeVisible();
  await page.keyboard.press('Alt+F10');
  const border = toolbar.getByRole('button', { name: '边框' });
  await expect(border).toBeFocused();
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('#B');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('image controls resume after movement ends while opacity animation continues', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) => {
    element.animate([{ opacity: 0.8 }, { opacity: 1 }], { duration: 400, iterations: Infinity });
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(20px)' }], { duration: 500 });
  });
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  await expect(page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' })).toBeFocused();
  expect(
    await image.evaluate((element) => element.getAnimations().some((animation) => animation.playState === 'running')),
  ).toBe(true);
});

test('keyboard actions follow a continuously moving image', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.evaluate((element: HTMLElement) => (element.style.marginLeft = '300px'));
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(80px)' }], {
      duration: 2000,
      iterations: Infinity,
      direction: 'alternate',
    }),
  );
  await page.keyboard.press('Alt+F10');
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  const border = toolbar.getByRole('button', { name: '边框' });
  await expect(border).toBeFocused();
  await expect(page.locator('.cherry-milkdown-image-frame')).toBeHidden();
  const positions = () =>
    page.evaluate(() => {
      const image = document.querySelector('.ProseMirror img:not(.ProseMirror-separator)')!.getBoundingClientRect();
      const toolbar = document.querySelector('.cherry-milkdown-image-controls')!.getBoundingClientRect();
      return { image: image.left, toolbar: toolbar.left };
    });
  const first = await positions();
  await page.waitForTimeout(300);
  const second = await positions();
  expect(Math.abs(second.image - first.image)).toBeGreaterThan(5);
  expect(Math.abs(second.toolbar - first.toolbar - (second.image - first.image))).toBeLessThan(4);
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('#B');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

for (const mechanism of ['css', 'web-animation'] as const) {
  test(`selected image controls follow a ${mechanism} animation started afterward`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await page.route('https://example.com/**', (route) =>
      route.fulfill({
        contentType: 'image/gif',
        body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
      }),
    );
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
    const image = page.locator('.ProseMirror img').first();
    await image.evaluate((element: HTMLElement) => (element.style.marginLeft = '300px'));
    await image.click();
    const toolbar = page.getByRole('toolbar', { name: '图片设置' });
    await expect(toolbar).toBeVisible();
    await expect(page.locator('.cherry-milkdown-image-frame')).toBeVisible();
    await expect.poll(() => image.evaluate((element) => element.getAnimations().length)).toBe(0);
    if (mechanism === 'css') {
      await page.addStyleTag({
        content:
          '@keyframes image-motion-probe { from { transform: translateX(0) } to { transform: translateX(80px) } } .image-motion-probe { animation: image-motion-probe 2s linear infinite alternate }',
      });
      await image.evaluate((element) => element.classList.add('image-motion-probe'));
    } else {
      await image.evaluate((element) =>
        element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(80px)' }], {
          duration: 2000,
          iterations: Infinity,
          direction: 'alternate',
        }),
      );
    }
    const positions = () =>
      page.evaluate(() => ({
        image: document.querySelector('.ProseMirror img:not(.ProseMirror-separator)')!.getBoundingClientRect().left,
        toolbar: document.querySelector('.cherry-milkdown-image-controls')!.getBoundingClientRect().left,
      }));
    const first = await positions();
    await page.waitForTimeout(300);
    const second = await positions();
    expect(Math.abs(second.image - first.image)).toBeGreaterThan(5);
    expect(Math.abs(second.toolbar - first.toolbar - (second.image - first.image))).toBeLessThan(4);
    const frame = page.locator('.cherry-milkdown-image-frame');
    await expect(frame).toBeHidden();
    await page.keyboard.press('Alt+F10');
    await expect(toolbar.getByRole('button', { name: '边框' })).toBeFocused();
    await image.evaluate((element) => element.getAnimations().forEach((animation) => animation.cancel()));
    await expect(frame).toBeVisible();
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('#B');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  });
}

test('animation observation stops when image controls close and when the editor is destroyed', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.evaluate((element) => {
    const original = element.getAnimations.bind(element);
    document.documentElement.dataset.imageAnimationReads = '0';
    element.getAnimations = (options) => {
      const root = document.documentElement;
      root.dataset.imageAnimationReads = String(Number(root.dataset.imageAnimationReads) + 1);
      return original(options);
    };
  });
  const reads = () => page.locator('html').getAttribute('data-image-animation-reads').then(Number);
  await image.click();
  await expect.poll(reads).toBeGreaterThan(3);
  await page.keyboard.press('Escape');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  await page.waitForTimeout(100);
  const afterEscape = await reads();
  await page.waitForTimeout(200);
  expect(await reads()).toBe(afterEscape);
  await image.click();
  await expect.poll(reads).toBeGreaterThan(afterEscape + 3);
  await page.evaluate(() => window.uploadEditor!.destroy());
  await page.waitForTimeout(100);
  const afterDestroy = await reads();
  await page.waitForTimeout(200);
  expect(await reads()).toBe(afterDestroy);
});

test('image controls follow a paused animation when its timeline is seeked', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.evaluate((element: HTMLElement) => (element.style.marginLeft = '300px'));
  await image.click();
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  const frame = page.locator('.cherry-milkdown-image-frame');
  await expect(toolbar).toBeVisible();
  await expect(frame).toBeVisible();
  await image.evaluate((element) => {
    const animation = element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(80px)' }], {
      duration: 2000,
      fill: 'both',
    });
    animation.pause();
    animation.currentTime = 0;
  });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const positions = () =>
    page.evaluate(() => ({
      image: document.querySelector('.ProseMirror img:not(.ProseMirror-separator)')!.getBoundingClientRect().left,
      toolbar: document.querySelector('.cherry-milkdown-image-controls')!.getBoundingClientRect().left,
      frame: document.querySelector('.cherry-milkdown-image-frame')!.getBoundingClientRect().left,
    }));
  const first = await positions();
  await image.evaluate((element) => {
    const animation = element.getAnimations().find((candidate) => candidate.playState === 'paused');
    if (!animation) throw new Error('Missing paused animation');
    animation.currentTime = 1000;
  });
  await expect.poll(async () => (await positions()).image - first.image).toBeGreaterThan(30);
  await expect.poll(async () => Math.abs((await positions()).toolbar - first.toolbar - 40)).toBeLessThan(4);
  await expect.poll(async () => Math.abs((await positions()).frame - first.frame - 40)).toBeLessThan(4);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await page.keyboard.press('Alt+F10');
  await expect(toolbar.getByRole('button', { name: '边框' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('#B');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('static selected images do not require continuous geometry reads', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeVisible();
  await expect.poll(() => image.evaluate((element) => element.getAnimations().length)).toBe(0);
  await image.evaluate((element) => {
    const original = element.getBoundingClientRect.bind(element);
    document.documentElement.dataset.imageGeometryReads = '0';
    element.getBoundingClientRect = () => {
      const root = document.documentElement;
      root.dataset.imageGeometryReads = String(Number(root.dataset.imageGeometryReads) + 1);
      return original();
    };
  });
  await page.waitForTimeout(150);
  const before = Number(await page.locator('html').getAttribute('data-image-geometry-reads'));
  await page.waitForTimeout(300);
  expect(Number(await page.locator('html').getAttribute('data-image-geometry-reads'))).toBe(before);
});

test('a paused and seeked image can still be resized and undone', async ({ page }, info) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  if (info.project.name === 'chromium-touch') await image.tap();
  else await image.click();
  await image.evaluate((element) => {
    const animation = element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(40px)' }], {
      duration: 2000,
      fill: 'both',
    });
    animation.pause();
    animation.currentTime = 1000;
  });
  const frame = page.locator('.cherry-milkdown-image-frame');
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const image = document.querySelector('.ProseMirror img:not(.ProseMirror-separator)')!.getBoundingClientRect();
        const frame = document.querySelector('.cherry-milkdown-image-frame')!.getBoundingClientRect();
        return Math.abs(frame.left - image.left);
      }),
    )
    .toBeLessThan(2);
  await expect(frame).toBeVisible();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  if (info.project.name === 'chromium-touch') {
    const input = await page.context().newCDPSession(page);
    try {
      await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      await input.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + 25, y: start.y }],
      });
      await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await input.detach();
    }
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 25, start.y, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toMatch(/#\d+px/);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('seeking an image animation during resize does not commit stale dimensions', async ({ page }, info) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.evaluate(() => (window.uploadChanges.length = 0));
  const image = page.locator('.ProseMirror img').first();
  if (info.project.name === 'chromium-touch') await image.tap();
  else await image.click();
  await image.evaluate((element) => {
    const animation = element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(80px)' }], {
      duration: 2000,
      fill: 'both',
    });
    animation.pause();
    animation.currentTime = 0;
  });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const input = info.project.name === 'chromium-touch' ? await page.context().newCDPSession(page) : undefined;
  try {
    if (input) {
      await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      await input.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + 10, y: start.y }],
      });
    } else {
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x + 10, start.y, { steps: 3 });
    }
    await image.evaluate((element) => {
      const animation = element.getAnimations().find((candidate) => candidate.playState === 'paused');
      if (!animation) throw new Error('Missing paused animation');
      animation.currentTime = 1000;
    });
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    if (input) {
      await input.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + 25, y: start.y }],
      });
      await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(start.x + 25, start.y, { steps: 3 });
      await page.mouse.up();
    }
  } finally {
    await input?.detach();
  }
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

for (const mechanism of ['web-animation', 'css-transition'] as const) {
  test(`starting a ${mechanism} during image resize does not commit stale dimensions`, async ({ page }, info) => {
    await page.route('https://example.com/**', (route) =>
      route.fulfill({
        contentType: 'image/gif',
        body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
      }),
    );
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
    await page.evaluate(() => (window.uploadChanges.length = 0));
    const image = page.locator('.ProseMirror img').first();
    if (info.project.name === 'chromium-touch') await image.tap();
    else await image.click();
    if (mechanism === 'css-transition') {
      await image.evaluate((element: HTMLElement) => {
        element.style.transition = 'transform 2s linear';
        element.style.transform = 'translateX(0px)';
      });
    }
    const handle = page.locator('[data-resize-handle="rightMiddle"]');
    await expect(handle).toBeVisible();
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    const input = info.project.name === 'chromium-touch' ? await page.context().newCDPSession(page) : undefined;
    try {
      if (input) {
        await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        await input.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: start.x + 10, y: start.y }],
        });
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(start.x + 10, start.y, { steps: 3 });
      }
      await image.evaluate((element: HTMLElement, mechanism) => {
        if (mechanism === 'css-transition') element.style.transform = 'translateX(60px)';
        else element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(60px)' }], { duration: 2000 });
      }, mechanism);
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
      if (input) {
        await input.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: start.x + 25, y: start.y }],
        });
        await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.mouse.move(start.x + 25, start.y, { steps: 3 });
        await page.mouse.up();
      }
    } finally {
      await input?.detach();
    }
    expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
  });
}

test('image resize remains undoable when its own width and height transition', async ({ page }, info) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.evaluate((element: HTMLElement) => (element.style.transition = 'width 0.5s linear, height 0.5s linear'));
  if (info.project.name === 'chromium-touch') await image.tap();
  else await image.click();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  if (info.project.name === 'chromium-touch') {
    const input = await page.context().newCDPSession(page);
    try {
      await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      await input.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + 25, y: start.y }],
      });
      await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await input.detach();
    }
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 25, start.y, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toMatch(/#\d+px/);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('canceling a resize for external animation restores the editor focus', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await page.keyboard.press('Alt+F10');
  await expect(page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' })).toBeFocused();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y, { steps: 3 });
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(60px)' }], { duration: 2000 }),
  );
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.mouse.up();
  await expect(page.locator('.ProseMirror')).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('canceling a resize for external animation does not steal outside focus', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  const handle = page.locator('[data-resize-handle="rightMiddle"]');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y, { steps: 3 });
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'external-resize-focus';
    document.body.append(input);
    input.focus();
  });
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(60px)' }], { duration: 2000 }),
  );
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.mouse.up();
  await expect(page.locator('#external-resize-focus')).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('moving image actions remain inside a narrow viewport', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  if (info.project.name === 'chromium-touch') await image.tap();
  else await image.click();
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(100px)' }], {
      duration: 2000,
      iterations: Infinity,
      direction: 'alternate',
    }),
  );
  await page.keyboard.press('Alt+F10');
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  await expect(toolbar.getByRole('button', { name: '边框' })).toBeFocused();
  await page.waitForTimeout(250);
  const box = await toolbar.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('#B');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('image resize handles return when continuous movement stops', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(50px)' }], {
      duration: 2000,
      iterations: Infinity,
      direction: 'alternate',
    }),
  );
  await page.keyboard.press('Alt+F10');
  const border = page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' });
  await expect(border).toBeFocused();
  const frame = page.locator('.cherry-milkdown-image-frame');
  await expect(frame).toBeHidden();
  await image.evaluate((element) => element.getAnimations().forEach((animation) => animation.cancel()));
  await expect(frame).toBeVisible();
  await expect(border).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('finite image effects do not block actions after they end beside continuous movement', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) => {
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(50px)' }], {
      duration: 2000,
      iterations: Infinity,
      direction: 'alternate',
    });
    element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.9)' }], { duration: 500 });
  });
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  await expect(page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' })).toBeFocused();
  expect(
    await image.evaluate((element) => element.getAnimations().some((animation) => animation.playState === 'running')),
  ).toBe(true);
});

test('image edit form follows continuous movement and preserves unsaved fields', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.evaluate((element: HTMLElement) => (element.style.marginLeft = '200px'));
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(60px)' }], {
      duration: 2000,
      iterations: Infinity,
      direction: 'alternate',
    }),
  );
  await page.keyboard.press('Alt+F10');
  const toolbar = page.getByRole('toolbar', { name: '图片设置' });
  await expect(toolbar.getByRole('button', { name: '边框' })).toBeFocused();
  for (let index = 0; index < 8; index++) await page.keyboard.press('Tab');
  await expect(toolbar.getByRole('button', { name: '编辑图片' })).toBeFocused();
  await page.keyboard.press('Enter');
  const form = page.getByRole('dialog', { name: '编辑图片' });
  const alt = form.getByLabel('图片替代文本');
  await alt.fill('unsaved');
  const positions = () =>
    page.evaluate(() => ({
      image: document.querySelector('.ProseMirror img:not(.ProseMirror-separator)')!.getBoundingClientRect().left,
      form: document.querySelector('.cherry-milkdown-image-source')!.getBoundingClientRect().left,
    }));
  const first = await positions();
  await page.waitForTimeout(300);
  const second = await positions();
  expect(Math.abs(second.image - first.image)).toBeGreaterThan(4);
  expect(Math.abs(second.form - first.form - (second.image - first.image))).toBeLessThan(4);
  await expect(alt).toHaveValue('unsaved');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  await page.keyboard.press('Escape');
  await expect(form).toBeHidden();
});

test('keyboard action waits for a longer finite image animation', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(20px)' }], { duration: 1500 }),
  );
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  await expect(page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' })).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});

test('canceling an image animation resumes a pending keyboard action', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.99)' }], { duration: 10000 }),
  );
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  await image.evaluate((element) => element.getAnimations().forEach((animation) => animation.cancel()));
  await expect(page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' })).toBeFocused();
});

test('programmatic focus away cancels a pending image keyboard action', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.99)' }], { duration: 400 }),
  );
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'outside-focus';
    document.body.append(button);
    button.focus();
  });
  await image.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expect(page.locator('#outside-focus')).toBeFocused();
});

test('clicking the image cancels pending keyboard focus', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.99)' }], { duration: 500 }),
  );
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  await image.click();
  await image.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expect(page.locator('.ProseMirror')).toBeFocused();
});

test('destroy cancels pending image toolbar focus', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.99)' }], { duration: 400 }),
  );
  await page.keyboard.press('Alt+F10');
  await page.evaluate(async () => {
    await window.uploadEditor!.destroy();
    const button = document.createElement('button');
    button.id = 'after-destroy';
    document.body.append(button);
    button.focus();
  });
  await page.waitForTimeout(500);
  await expect(page.locator('#after-destroy')).toBeFocused();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toHaveCount(0);
});

test('replacing the selected image cancels a pending toolbar focus', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img').first();
  await image.click();
  await image.evaluate((element) =>
    element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.99)' }], { duration: 400 }),
  );
  await page.keyboard.press('Alt+F10');
  await expect(page.locator('.cherry-milkdown-image-controls')).toBeHidden();
  const replacement = '![replacement](https://example.com/replacement.png)';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), replacement);
  await expect(page.locator('.ProseMirror img[alt="replacement"]')).toHaveCount(1);
  await page.waitForTimeout(500);
  await expect(page.locator('.ProseMirror')).toBeFocused();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(replacement);
});

for (const theme of ['default', 'dark', 'abyss', 'green', 'red', 'gray', 'violet', 'blue'] as const) {
  test(`keyboard focus stays distinguishable on an active image action in ${theme} theme`, async ({ page }) => {
    await page.route('https://example.com/**', (route) =>
      route.fulfill({
        contentType: 'image/gif',
        body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
      }),
    );
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    await page.evaluate((theme) => window.uploadEditor!.setTheme(theme), theme);
    const original = '![original#shadow](https://example.com/original.png)';
    await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original);
    await page.locator('.ProseMirror img[alt="original#shadow"]').click();
    const toolbar = page.getByRole('toolbar', { name: '图片设置' });
    const shadow = toolbar.getByRole('button', { name: '阴影' });
    await expect(shadow).toHaveAttribute('aria-pressed', 'true');
    const focusStyle = () =>
      shadow.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.outlineStyle, style.outlineWidth, style.outlineColor, style.boxShadow];
      });
    const unfocused = await focusStyle();
    await toolbar.getByRole('button', { name: '边框' }).focus();
    await page.keyboard.press('Tab');
    await expect(shadow).toBeFocused();
    expect(await shadow.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    expect(await focusStyle()).not.toEqual(unfocused);
    const colors = await shadow.evaluate((element) => ({
      outline: getComputedStyle(element).outlineColor,
      background: getComputedStyle(element.closest('[role="toolbar"]')!).backgroundColor,
    }));
    expect(colorContrast(colors.outline, colors.background)).toBeGreaterThanOrEqual(3);
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('![original](');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
  });
}

test('Escape on an unrelated control inside the editor host is not intercepted by image controls', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'host-owned-control';
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') input.dataset.prevented = String(event.defaultPrevented);
    });
    document.querySelector('.cherry-milkdown')!.append(input);
  });
  await page.locator('.ProseMirror img').first().click();
  await expect(page.getByRole('toolbar', { name: '图片设置' })).toBeVisible();
  const control = page.locator('#host-owned-control');
  await control.focus();
  await page.keyboard.press('Escape');
  await expect(control).toHaveAttribute('data-prevented', 'false');
  await expect(control).toBeFocused();
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await expect(dialog).toBeVisible();
  await control.focus();
  await page.keyboard.press('Escape');
  await expect(control).toHaveAttribute('data-prevented', 'false');
  await expect(control).toBeFocused();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('图片地址').focus();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('late upload callbacks cannot overwrite a newer image selection', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));

  const image = page.locator('.ProseMirror img').first();
  const open = async () => {
    await image.click();
    await page.getByRole('button', { name: '编辑图片' }).click();
  };
  const file = page.locator('.cherry-milkdown-image-source input[type="file"]');
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  const select = async (name: string) =>
    file.setInputFiles({ name, mimeType: 'image/png', buffer: Buffer.from('test-image') });

  await open();
  await select('first.png');
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  expect(await page.evaluate(() => window.uploads[0]!.signal.aborted)).toBe(true);

  await open();
  await select('second.png');
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/old.png'));
  await expect(dialog.getByLabel('图片地址')).toHaveValue('https://example.com/original.png');
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeDisabled();
  await page.evaluate(() => window.uploads[1]!.finish('https://example.com/new.png'));
  await expect(dialog.getByLabel('图片地址')).toHaveValue('https://example.com/new.png');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('new.png');
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/late.png'));
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('late.png');
});

test('the editor starts when browser storage is unavailable', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage access denied', 'SecurityError');
      },
    });
  });
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor), undefined, { timeout: 5_000 });
  await expect(page.locator('.ProseMirror')).toBeVisible();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(
    '![original](https://example.com/original.png)',
  );
});

test('disabling the Cherry br hook cannot bypass a denied storage read', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Storage read denied', 'SecurityError');
    };
  });
  await page.goto('/upload-harness.html?fail-init&disabled-br');
  await page.waitForFunction(() => window.failedEditorRejected === true);
  expect(await page.evaluate(() => window.failedEditorError)).toContain('create: SecurityError: Storage read denied');
  await expect(page.locator('#editor')).toHaveText('Host content');
  await expect(page.locator('#editor .ProseMirror')).toHaveCount(0);
});

test('a throwing create reporter does not hide a denied storage error', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage access denied', 'SecurityError');
      },
    });
  });
  await page.goto('/upload-harness.html?fail-init&throw-error-reporter');
  await page.waitForFunction(() => window.failedEditorRejected === true);
  expect(await page.evaluate(() => window.failedEditorError)).toBe('create: SecurityError: Storage access denied');
  expect(await page.evaluate(() => window.failedEditorRejection)).toBe('SecurityError: Storage access denied');
  await expect(page.locator('#editor')).toHaveText('Host content');
  await expect(page.locator('#editor .ProseMirror')).toHaveCount(0);
});

test('a throwing create reporter preserves a later initialization error and cleanup', async ({ page }) => {
  await page.goto('/upload-harness.html?fail-init&throw-error-reporter');
  await page.waitForFunction(() => window.failedEditorRejected === true);
  expect(await page.evaluate(() => window.failedEditorError)).toBe('create: Error: Initial serialization failed');
  expect(await page.evaluate(() => window.failedEditorRejection)).toBe('Error: Initial serialization failed');
  expect(await page.evaluate(() => window.failedEditorCleaned)).toBe(true);
  await expect(page.locator('#editor')).toHaveText('Host content');
  await expect(page.locator('#editor .ProseMirror')).toHaveCount(0);
});

test('a throwing asynchronous parse reporter does not prevent later editing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/upload-harness.html?async-reporter-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.evaluate(() => window.installSerializerFailure());
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.asyncParseErrors)).toEqual(['parse: Error: Serialization failed']);
  await page.evaluate(() => window.restoreSerializer());
  await page.keyboard.type('?');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before!?');
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1))).toBe('Before!?');
  expect(errors).toEqual([]);
});

test('a local serialization failure does not publish an older notification and can recover without new input', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/upload-harness.html?async-reporter-failure&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('1');
  await page.evaluate(() => window.installSerializerFailure());
  await page.keyboard.type('2');
  await expect.poll(() => page.evaluate(() => window.asyncParseErrors)).toEqual(['parse: Error: Serialization failed']);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
  await page.evaluate(() => window.restoreSerializer());
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before12');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Before12']);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before');
  expect(errors).toEqual([]);
});

test('destroy snapshots a recovered serialization failure without another edit', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?async-reporter-failure&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.uploadEditor!.setMarkdown('Before', { emit: false });
    window.uploadChanges = [];
    window.installSerializerFailure();
  });
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.asyncParseErrors)).toContain('parse: Error: Serialization failed');
  const result = await page.evaluate(async () => {
    window.restoreSerializer();
    await window.uploadEditor!.destroy();
    return window.uploadEditor!.getMarkdown();
  });
  expect(result).toBe('Before!');
  await expect(editor).toHaveCount(0);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
});

test('a serializer that writes a newer document cannot publish stale local content', async ({ page }) => {
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.evaluate(() => window.installSerializerReentry());
  await page.keyboard.type('!');
  await expect(page.locator('.ProseMirror')).toHaveText('Latest');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Latest');
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
  await page.evaluate(() => window.restoreSerializer());
});

test('a document edit during final external serialization is reconciled', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?async-parse-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.installFinalSerializerEdit();
    window.uploadEditor!.setMarkdown('External', { emit: false });
  });
  await expect(page.locator('.ProseMirror')).toContainText('latestExternal');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('latestExternal');
  await expect
    .poll(() => page.evaluate(() => window.uploadChanges.includes(window.uploadEditor!.getMarkdown())))
    .toBe(true);
  expect(await page.evaluate(() => window.uploadChanges)).not.toContain('External');
});

test('a plugin append after a silent external update is visible to the consumer', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?external-append-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('External', { emit: false }));
  const editor = page.locator('.ProseMirror');
  await expect(editor).toHaveText('External!');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toContain('External!');
  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.type('?');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External!?');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External!');
});

test('a plugin can append an empty paragraph during a silent external update', async ({ page }) => {
  await page.goto('/upload-harness.html?external-append-empty');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('External', { emit: false }));
  await expect(page.locator('.ProseMirror > p')).toHaveCount(2);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External\n\n');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toContain('External\n\n');
  await page.locator('.ProseMirror > p').last().click();
  await page.keyboard.type('New');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External\n\nNew\n');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External\n\n');
});

test('a plugin view failure after dispatch reconciles the committed document', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?plugin-view-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('External'));
  const editor = page.locator('.ProseMirror');
  await expect(editor).toHaveText('External');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toContain('External');
  expect(await page.evaluate(() => window.asyncParseErrors)).toEqual(['parse: Error: Plugin view failed']);
  expect(await page.evaluate(() => window.recoveryContext!.getPreviousMarkdown())).toBe('Before!');
  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External');
});

test('a failed appended transaction preserves input and keeps editor state aligned', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?plugin-append-throw');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Local', { emit: false }));
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('External'));
  expect(await page.evaluate(() => window.editorStateIsAligned())).toBe(true);
  expect(await page.evaluate(() => window.asyncParseErrors)).toEqual(['parse: Error: Append failed']);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Local!');
  await page.waitForTimeout(600);
  await page.keyboard.type('?');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Local!?');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Local!');
  expect(await page.evaluate(() => window.editorStateIsAligned())).toBe(true);
});

test('a filtered external update preserves source and later local input', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?plugin-filter-external&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.uploadEditor!.setMarkdown('* Item\r\n\r\n', { emit: false });
    window.uploadEditor!.setMarkdown('External', { emit: false });
  });
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('* Item\r\n\r\n');
  expect(await page.evaluate(() => window.asyncParseErrors)).toEqual([
    'parse: Error: External Markdown update was not applied by the editor.',
  ]);
  const editor = page.locator('.ProseMirror li p');
  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Item!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1))).toContain('Item!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('* Item\r\n\r\n');
});

test('list marker formatting survives undo after external initialization', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('* Item\r\n\r\n', { emit: false }));
  await page.locator('.ProseMirror li p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Item!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('* Item\r\n\r\n');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Item!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('* Item\r\n\r\n');
});

test('typing in a list preserves the original source marker', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('* Item\r\n\r\n', { emit: false }));
  await page.locator('.ProseMirror li p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('* Item!\r\n\r\n');
});

test('sequential edits in repeated text preserve unrelated Markdown spelling and undo', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'Title\r\n=====\r\n\r\n* Same\r\n* Same\r\n\r\n__Same__\r\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror li p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  const first = 'Title\r\n=====\r\n\r\n* Same\r\n* Same!\r\n\r\n__Same__\r\n';
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()), { timeout: 2000 }).toBe(first);
  await page.locator('.ProseMirror > p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('?');
  const second = 'Title\r\n=====\r\n\r\n* Same\r\n* Same!\r\n\r\n__Same?__\r\n';
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(second);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(first);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
});

test('sequential edits in repeated mixed content retain the edited text and undo', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'Title\r\n=====\r\n\r\n* Same\r\n* Same\r\n\r\n__Same__\r\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  const items = page.locator('.ProseMirror li p');
  await items.last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect(items).toHaveText(['Same', 'Same!']);
  const first = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  await page.locator('.ProseMirror > p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('?');
  await expect(page.locator('.ProseMirror > p').last()).toHaveText('Same?');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Same?');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(first);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(items).toHaveText(['Same', 'Same']);
  await expect(page.locator('.ProseMirror > p').last()).toHaveText('Same');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('Same!');
});

test('a larger repeated list retains unrelated source formatting through edit and undo', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const prefix = 'Title\r\n=====\r\n\r\n';
  const list = Array.from({ length: 15 }, () => '* Same').join('\r\n');
  const suffix = '\r\n\r\n' + Array.from({ length: 40 }, (_, index) => `Paragraph ${index} with **bold text**.`).join('\r\n\r\n');
  const source = prefix + list + suffix;
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror li p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(prefix + list + '!' + suffix);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
});

test('long repeated source survives separate edits and undo without changing other Markdown', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const prefix = 'Title\r\n=====\r\n\r\n';
  const list = Array.from({ length: 15 }, () => '* Same').join('\r\n');
  const paragraphs = Array.from({ length: 600 }, (_, index) => `Paragraph ${index} contains **bold text** and a [link](https://example.com/${index}).`);
  const suffix = '\r\n\r\n' + paragraphs.join('\r\n\r\n');
  const source = prefix + list + suffix;
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror li p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  const first = prefix + list + '!' + suffix;
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(first);
  await page.locator('.ProseMirror > p').filter({ hasText: 'Paragraph 599 ' }).click();
  await page.keyboard.press('End');
  await page.keyboard.type('?');
  const second = first + '?';
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(second);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(first);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
});

for (const operation of ['delete', 'replace', 'unicode'] as const) {
  test(`a larger repeated list preserves source through ${operation} and undo`, async ({ page }) => {
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const prefix = 'Title\r\n=====\r\n\r\n';
    const before = Array.from({ length: 14 }, () => '* Same').join('\r\n') + '\r\n';
    const suffix = '\r\n\r\n' + Array.from({ length: 40 }, (_, index) => `Paragraph ${index} with **bold text**.`).join('\r\n\r\n');
    const source = prefix + before + '* Same' + suffix;
    await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
    await page.locator('.ProseMirror li p').last().click();
    await page.keyboard.press('End');
    if (operation === 'delete') await page.keyboard.press('Backspace');
    else if (operation === 'replace') {
      for (let index = 0; index < 4; index++) await page.keyboard.press('Shift+ArrowLeft');
      await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('Same');
      await page.keyboard.type('Changed');
    } else await page.keyboard.insertText('中文🙂');
    const content = operation === 'delete' ? 'Sam' : operation === 'replace' ? 'Changed' : 'Same中文🙂';
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(prefix + before + '* ' + content + suffix);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  });
}

test('editing repeated text preserves references, escapes and footnote source through undo', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const source = 'Heading\r\n=======\r\n\r\n[Same][ref] and \\*literal\\*.[^note]\r\n\r\nSame text.\r\n\r\n[ref]: https://example.com/path\r\n\r\n[^note]: Footnote text.\r\n';
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror > p').filter({ hasText: 'Same text.' }).click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source.replace('Same text.', 'Same text.!'));
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
});

test('editing after repeated emoji and Chinese text preserves source offsets and undo', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const prefix = '标题\r\n====\r\n\r\n';
  const before = Array.from({ length: 14 }, () => '* 🙂相同').join('\r\n') + '\r\n';
  const suffix = '\r\n\r\n' + Array.from({ length: 40 }, (_, index) => `段落 ${index} with **bold text**.`).join('\r\n\r\n');
  const source = prefix + before + '* 🙂相同' + suffix;
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.ProseMirror li p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.insertText('新🙂');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(prefix + before + '* 🙂相同新🙂' + suffix);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
});

test('repeated text inside a Cherry panel preserves surrounding source and undo', async ({ page }) => {
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const prefix = 'Title\n=====\n\n' + Array.from({ length: 15 }, () => '* Same').join('\n') + '\n\n';
  const panel = ':::warning Notice\nSame\n\nSame\n:::';
  const suffix = '\n\n' + Array.from({ length: 40 }, (_, index) => `Paragraph ${index} with **bold text**.`).join('\n\n');
  const source = prefix + panel + suffix;
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
  await page.locator('.cherry-panel--body p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  const expected = prefix + ':::warning Notice\nSame\n\nSame!\n:::' + suffix;
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()), { timeout: 2500 }).toBe(expected);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
});

for (const [name, source, target, selector] of [
  ['asterisk', '* Item\n', 'Item', '.ProseMirror li p'],
  ['underscore', '__Text__\n', 'Text', '.ProseMirror p'],
  ['setext', 'Heading\n=======\n', 'Heading', '.ProseMirror h1'],
  ['nested', '* Outer\n  + Inner\n', 'Inner', '.ProseMirror li p'],
] as const) {
  test(`Cherry source parity for ${name}`, async ({ page }) => {
    await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
    await page.locator(selector).filter({ hasText: target }).last().click();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type('!');
    const expected = source.replace(target, `${target.slice(0, 2)}!${target.slice(2)}`);
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(expected);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  });
}

for (const [label, source, selector, expected] of [
  ['underscore emphasis', '__Text__\n', '.ProseMirror p', '__Te!xt__\n'],
  ['setext heading', 'Heading\n=======\n', '.ProseMirror h1', 'He!ading\n=======\n'],
] as const) {
  test(`source editing preserves ${label}`, async ({ page }) => {
    await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    await page.evaluate((value) => window.uploadEditor!.setMarkdown(value, { emit: false }), source);
    await page.locator(selector).click();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type('!');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(expected);
  });
}

test('list item creation and deletion preserve text and undo history', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('* First\n', { emit: false }));
  await page.locator('.ProseMirror li p').click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second');
  await expect(page.locator('.ProseMirror li')).toHaveCount(2);
  await expect(page.locator('.ProseMirror li').nth(1)).toHaveText('Second');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Second');
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1) === window.uploadEditor!.getMarkdown())).toBe(true);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('Second');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Second');
  await page.keyboard.press('Home');
  await page.keyboard.press('Backspace');
  await expect(page.locator('.ProseMirror li')).toHaveCount(1);
  await expect(page.locator('.ProseMirror li')).toHaveText('FirstSecond');
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1) === window.uploadEditor!.getMarkdown())).toBe(true);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.ProseMirror li')).toHaveCount(2);
  await expect(page.locator('.ProseMirror li').nth(1)).toHaveText('Second');
});

for (const [label, source, target] of [
  ['plus marker', '+ Item\n', 'Item'],
  ['mixed markers', '* First\n+ Second\n', 'Second'],
  ['nested markers', '* Outer\n  + Inner\n', 'Inner'],
] as const) {
  test(`undo restores ${label}`, async ({ page }) => {
    await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
    await page.goto('/upload-harness.html');
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    await page.evaluate((markdown) => window.uploadEditor!.setMarkdown(markdown, { emit: false }), source);
    await page.locator('.ProseMirror li p').filter({ hasText: target }).last().click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source.replace(target, `${target}!`));
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source.replace(target, `${target}!`));
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(source);
  });
}

test('an injected engine can edit when browser storage is unavailable', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage access denied', 'SecurityError');
      },
    });
  });
  await page.goto('/upload-harness.html?engine-style-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Text'));
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' added');
  await expect(paragraph).toHaveText('Text added');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Text added');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Text');
});

test('default engine storage failure preserves the host and can be retried after storage recovers', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage access denied', 'SecurityError');
      },
    });
  });
  await page.goto('/upload-harness.html?fail-init');
  await page.waitForFunction(() => window.failedEditorRejected === true);
  expect(await page.evaluate(() => window.failedEditorError)).toContain('create: SecurityError: Storage access denied');
  await expect(page.locator('#editor')).toHaveText('Host content');
  await expect(page.locator('#editor .ProseMirror')).toHaveCount(0);

  await page.evaluate(async () => {
    Reflect.deleteProperty(window, 'localStorage');
    window.uploadEditor = await window.retryUploadEditor();
  });
  await expect(page.locator('#editor .ProseMirror')).toBeVisible();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('original.png');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Recovered'));
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' text');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Recovered text');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Recovered');
});

test('upload completion and form submission cannot change an editor after destruction is requested', async ({
  page,
}) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await page.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
    name: 'pending.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test-image'),
  });
  const state = await page.evaluate(async () => {
    const address = document.querySelector<HTMLInputElement>('.cherry-milkdown-image-source input[name="source"]')!;
    const form = document.querySelector<HTMLFormElement>('.cherry-milkdown-image-source')!;
    const image = document.querySelector<HTMLImageElement>('.ProseMirror img')!;
    const originalAddress = address.value;
    const originalImage = image.getAttribute('src');
    const destroyed = window.uploadEditor!.destroy();
    window.uploads[0]!.finish('https://example.com/late.png');
    const afterFinish = address.value;
    // Exercise submit independently of the ignored upload callback.
    address.value = 'https://example.com/manual-after-destroy.png';
    form.requestSubmit();
    const afterSubmit = image.getAttribute('src');
    await destroyed;
    return { originalAddress, originalImage, afterFinish, afterSubmit, aborted: window.uploads[0]!.signal.aborted };
  });
  expect(state.afterFinish).toBe(state.originalAddress);
  expect(state.afterSubmit).toBe(state.originalImage);
  expect(state.aborted).toBe(true);
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
});

test('an external prepend does not leave an image upload stuck', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await page.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
    name: 'pending.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test-image'),
  });
  const updated = 'New paragraph\n\n![original](https://example.com/original.png)';
  await page.evaluate((markdown) => window.uploadEditor!.setMarkdown(markdown), updated);
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/uploaded.png'));
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('uploaded.png');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('New paragraph');
  await expect(page.locator('.cherry-milkdown-image-frame')).toBeVisible();
});

test('manually editing the image address cancels an in-flight upload and preserves the typed address', async ({
  page,
}) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await page.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
    name: 'pending.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test-image'),
  });
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  const address = dialog.getByLabel('图片地址');
  await address.fill('https://example.com/manual.png');
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/stale.png'));
  await expect(address).toHaveValue('https://example.com/manual.png');
  expect(await page.evaluate(() => window.uploads[0]!.signal.aborted)).toBe(true);
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('manual.png');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).not.toContain('stale.png');
});

test('manually replacing an uploaded address discards that upload’s image attributes', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await page.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
    name: 'uploaded.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test-image'),
  });
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  const address = dialog.getByLabel('图片地址');
  await page.evaluate(() =>
    window.uploads[0]!.finish('https://example.com/uploaded.png', { width: 123, isBorder: true }),
  );
  await expect(address).toHaveValue('https://example.com/uploaded.png');
  await address.fill('https://example.com/manual.png');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toBe('![original](https://example.com/manual.png)');
});

test('a failed upload after an external prepend can be retried without losing the new content', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  const file = page.locator('.cherry-milkdown-image-source input[type="file"]');
  const select = (name: string) =>
    file.setInputFiles({ name, mimeType: 'image/png', buffer: Buffer.from('test-image') });
  const dialog = page.getByRole('dialog', { name: '编辑图片' });
  await select('first.png');
  await page.evaluate(() =>
    window.uploadEditor!.setMarkdown('New paragraph\n\n![original](https://example.com/original.png)'),
  );
  await page.evaluate(() => window.uploads[0]!.reject(new Error('upload failed')));
  await expect(dialog.getByRole('status')).toHaveText('图片上传失败，请重试。');
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
  await select('retry.png');
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/stale.png'));
  await expect(dialog.getByRole('button', { name: '保存', exact: true })).toBeDisabled();
  await page.evaluate(() => window.uploads[1]!.finish('https://example.com/retry.png'));
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('retry.png');
  const markdown = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  expect(markdown).toContain('New paragraph');
  expect(markdown).not.toContain('stale.png');
});

test('replacing an image externally cancels its pending upload', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await page.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
    name: 'pending.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test-image'),
  });
  const replacement = '![replacement](https://example.com/replacement.png)';
  await page.evaluate((markdown) => window.uploadEditor!.setMarkdown(markdown), replacement);
  expect(await page.evaluate(() => window.uploads[0]!.signal.aborted)).toBe(true);
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/late.png'));
  await expect(page.getByRole('dialog', { name: '编辑图片' })).toBeHidden();
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(replacement);
});

test('destroying an editor aborts its upload and a late callback cannot affect its replacement', async ({ page }) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await page.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
    name: 'pending.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test-image'),
  });
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeDisabled();
  await page.evaluate(async () => {
    await window.uploadEditor!.destroy();
    window.uploadEditor = await window.createUploadEditor();
  });
  expect(await page.evaluate(() => window.uploads[0]!.signal.aborted)).toBe(true);
  await page.evaluate(() => window.uploads[0]!.finish('https://example.com/late.png'));
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(
    '![original](https://example.com/original.png)',
  );
  await page.locator('.ProseMirror img').first().click();
  await page.getByRole('button', { name: '编辑图片' }).click();
  await expect(page.getByRole('dialog', { name: '编辑图片' }).getByLabel('图片地址')).toHaveValue(
    'https://example.com/original.png',
  );
});

test('read-only content cannot be changed through task, table, code, image or keyboard interaction', async ({
  page,
}) => {
  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    }),
  );
  await page.goto('/upload-harness.html?readonly');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const editor = page.locator('.ProseMirror');
  await expect(editor).toHaveAttribute('contenteditable', 'false');
  await editor
    .locator('li[data-item-type="task"] .cherry-task-checkbox, li[data-item-type="task"] .ch-icon')
    .first()
    .click();
  await editor.locator('td').first().click();
  await page.keyboard.type('unexpected');
  for (const cell of await editor.locator('th, td').all()) {
    await cell.hover();
    await expect(editor.locator('.milkdown-table-block .handle[data-show="true"]')).toHaveCount(0);
  }
  await expect(editor.getByRole('combobox', { name: '代码语言' })).toBeDisabled();
  await editor.locator('.cherry-milkdown-code-block__content').click();
  await page.keyboard.type('unexpected');
  await editor.locator('img[src]').first().click();
  await expect(page.getByRole('button', { name: '编辑图片' })).toHaveCount(0);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(original);
});
