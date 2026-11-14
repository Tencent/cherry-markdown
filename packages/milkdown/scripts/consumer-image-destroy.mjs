import assert from 'node:assert/strict';

/** Invalid image addresses stay editable; safe image data and undo still work. */
export async function checkConsumerImageAddress(page) {
  const imageUrl = 'https://example.com/consumer-original.png';
  const route = (request) =>
    request.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    });
  await page.route(imageUrl, route);
  try {
    await page.evaluate(() => window.createConsumerUpload());
    const root = page.locator('.consumer-upload-test');
    const before = await page.evaluate(() => window.consumerUploadEditor.getMarkdown());
    await root.locator('.ProseMirror img[alt="original"]').click();
    await root.getByRole('button', { name: '编辑图片' }).click();
    const dialog = root.getByRole('dialog', { name: '编辑图片' });
    const source = dialog.getByLabel('图片地址');
    await source.fill('data:text/html,unsafe');
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    assert.equal(await source.getAttribute('aria-invalid'), 'true');
    assert.equal(await dialog.getByRole('status').textContent(), '图片地址不安全，请修改。');
    assert.equal(await page.evaluate(() => window.consumerUploadEditor.getMarkdown()), before);
    await root.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
      name: 'unsafe.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test-image'),
    });
    await page.evaluate(() => window.consumerUploadFinish('javascript:alert(1)'));
    assert.equal(await source.getAttribute('aria-invalid'), 'true');
    assert.equal(await dialog.getByRole('status').textContent(), '图片地址不安全，请修改。');
    assert.equal(await page.evaluate(() => window.consumerUploadEditor.getMarkdown()), before);
    const safe = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    await source.fill(safe);
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    await page.waitForFunction((value) => window.consumerUploadEditor.getMarkdown().includes(value), safe);
    assert.equal(await root.locator('.ProseMirror img[alt="original"]').getAttribute('src'), safe);
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForFunction((value) => window.consumerUploadEditor.getMarkdown() === value, before);
  } finally {
    await page.evaluate(async () => {
      await window.consumerUploadEditor?.destroy();
      document.querySelector('.consumer-upload-test')?.remove();
      delete window.consumerUploadEditor;
    });
    await page.unroute(imageUrl, route);
  }
}

/** Ignore malformed upload metadata while preserving valid metadata. */
export async function checkConsumerImageMetadata(page) {
  const imageUrl = 'https://example.com/consumer-original.png';
  const route = (request) =>
    request.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    });
  await page.route(imageUrl, route);
  try {
    await page.evaluate(() => window.createConsumerUpload());
    const root = page.locator('.consumer-upload-test');
    const before = await page.evaluate(() => window.consumerUploadEditor.getMarkdown());
    await root.locator('.ProseMirror img[alt="original"]').click();
    await root.getByRole('button', { name: '编辑图片' }).click();
    const dialog = root.getByRole('dialog', { name: '编辑图片' });
    const alt = dialog.getByLabel('图片替代文本');
    const file = dialog.locator('input[type="file"]');
    await alt.fill('');
    await file.setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('bad') });
    await page.evaluate(() =>
      window.consumerUploadFinish('https://example.com/bad.png', { name: {}, width: {}, isBorder: 'false' }),
    );
    assert.equal(await alt.inputValue(), 'bad');
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    await page.waitForFunction(() =>
      window.consumerUploadEditor.getMarkdown().includes('![bad](https://example.com/bad.png)'),
    );
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForFunction((value) => window.consumerUploadEditor.getMarkdown() === value, before);
    await root.getByRole('button', { name: '编辑图片' }).click();
    await alt.fill('');
    await file.setInputFiles({ name: 'valid.png', mimeType: 'image/png', buffer: Buffer.from('valid') });
    await page.evaluate(() => {
      const params = { name: 'Custom', width: 123, isBorder: true };
      window.consumerUploadFinish('https://example.com/valid.png', params);
      params.width = 999;
      params.isBorder = false;
    });
    assert.equal(await alt.inputValue(), 'Custom');
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    await page.waitForFunction(() => window.consumerUploadEditor.getMarkdown().includes('valid.png'));
    assert.equal(
      await page.evaluate(() => window.consumerUploadEditor.getMarkdown()),
      '![Custom#123px#auto#B](https://example.com/valid.png)',
    );
  } finally {
    await page.evaluate(async () => {
      await window.consumerUploadEditor?.destroy();
      document.querySelector('.consumer-upload-test')?.remove();
      delete window.consumerUploadEditor;
    });
    await page.unroute(imageUrl, route);
  }
}

/** Invalid upload results and rejections must show an error and allow retry. */
export async function checkConsumerImageFailure(page) {
  const imageUrl = 'https://example.com/consumer-original.png';
  const route = (request) =>
    request.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    });
  await page.route(imageUrl, route);
  try {
    await page.evaluate(() => window.createConsumerUpload());
    const root = page.locator('.consumer-upload-test');
    await root.locator('.ProseMirror img[alt="original"]').click();
    await root.getByRole('button', { name: '编辑图片' }).click();
    const dialog = root.getByRole('dialog', { name: '编辑图片' });
    const file = root.locator('.cherry-milkdown-image-source input[type="file"]');
    const before = await page.evaluate(() => window.consumerUploadEditor.getMarkdown());
    await file.setInputFiles({ name: 'invalid.png', mimeType: 'image/png', buffer: Buffer.from('test-image') });
    await page.evaluate(() => window.consumerUploadFinish(null));
    assert.equal(await dialog.getByRole('status').textContent(), '图片上传失败，请重试。');
    assert.equal(await dialog.getByRole('button', { name: '保存', exact: true }).isEnabled(), true);
    assert.equal(await page.evaluate(() => window.consumerUploadEditor.getMarkdown()), before);
    await file.setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('test-image') });
    await page.evaluate(() =>
      window.consumerUploadFinish('https://example.com/broken.png', {
        get name() {
          throw new Error('Metadata unavailable');
        },
      }),
    );
    assert.equal(await dialog.getByRole('status').textContent(), '图片上传失败，请重试。');
    assert.equal(await dialog.getByRole('button', { name: '保存', exact: true }).isEnabled(), true);
    assert.equal(await page.evaluate(() => window.consumerUploadEditor.getMarkdown()), before);
    await file.setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: Buffer.from('test-image') });
    await page.evaluate(() => window.consumerUploadReject(new Error('Simulated upload failure')));
    await page.waitForFunction(() =>
      document.querySelector('.consumer-upload-test [role="status"]')?.textContent?.includes('上传失败'),
    );
    assert.equal(await dialog.getByRole('button', { name: '保存', exact: true }).isEnabled(), true);
    await dialog.getByLabel('图片替代文本').fill('');
    await file.setInputFiles({ name: 'retry.png', mimeType: 'image/png', buffer: Buffer.from('test-image') });
    await page.evaluate(() => window.consumerUploadFinish('https://example.com/retry.png', null));
    assert.equal(await dialog.getByLabel('图片地址').inputValue(), 'https://example.com/retry.png');
    assert.equal(await dialog.getByLabel('图片替代文本').inputValue(), 'retry');
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    await page.waitForFunction(() => window.consumerUploadEditor.getMarkdown().includes('retry.png'));
  } finally {
    await page.evaluate(async () => {
      await window.consumerUploadEditor?.destroy();
      document.querySelector('.consumer-upload-test')?.remove();
      delete window.consumerUploadEditor;
    });
    await page.unroute(imageUrl, route);
  }
}

/** One installed editor must not cancel another editor's image upload. */
export async function checkConsumerImageIsolation(page) {
  const imageUrl = 'https://example.com/consumer-original.png';
  const route = (request) =>
    request.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    });
  await page.route(imageUrl, route);
  try {
    await page.evaluate(async () => {
      await window.createConsumerUpload();
      await window.createConsumerNested();
    });
    const root = page.locator('.consumer-upload-test');
    await root.locator('.ProseMirror img[alt="original"]').click();
    await root.getByRole('button', { name: '编辑图片' }).click();
    await root.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
      name: 'pending.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test-image'),
    });
    await page.evaluate(async () => {
      window.consumerNestedEditor.setMarkdown('Other editor updated', { emit: false });
      await window.consumerNestedEditor.destroy();
    });
    assert.equal(await page.evaluate(() => window.consumerUploadSignal.aborted), false);
    await page.evaluate(() => window.consumerUploadFinish('https://example.com/consumer-uploaded.png'));
    const dialog = root.getByRole('dialog', { name: '编辑图片' });
    await dialog.getByLabel('图片地址').waitFor();
    assert.equal(await dialog.getByLabel('图片地址').inputValue(), 'https://example.com/consumer-uploaded.png');
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    await page.waitForFunction(() => window.consumerUploadEditor.getMarkdown().includes('consumer-uploaded.png'));
  } finally {
    await page.evaluate(async () => {
      await Promise.all([window.consumerUploadEditor?.destroy(), window.consumerNestedEditor?.destroy()]);
      document.querySelector('.consumer-upload-test')?.remove();
      document.querySelector('.consumer-nested-test')?.remove();
      delete window.consumerUploadEditor;
      delete window.consumerNestedEditor;
    });
    await page.unroute(imageUrl, route);
  }
}

/** Upload completion cannot mutate an editor whose destruction has started. */
export async function checkConsumerImageDestroy(page) {
  const imageUrl = 'https://example.com/consumer-original.png';
  const route = (request) =>
    request.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    });
  await page.route(imageUrl, route);
  try {
    await page.evaluate(() => window.createConsumerUpload());
    const root = page.locator('.consumer-upload-test');
    await root.locator('.ProseMirror img[alt="original"]').click();
    await root.getByRole('button', { name: '编辑图片' }).click();
    await root.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
      name: 'pending.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test-image'),
    });
    const state = await page.evaluate(async () => {
      const root = document.querySelector('.consumer-upload-test');
      const address = root.querySelector('.cherry-milkdown-image-source input[name="source"]');
      const form = root.querySelector('.cherry-milkdown-image-source');
      const image = root.querySelector('.ProseMirror img[alt="original"]');
      const originalAddress = address.value;
      const originalImage = image.getAttribute('src');
      const destroyed = window.consumerUploadEditor.destroy();
      window.consumerUploadFinish('https://example.com/late.png');
      const afterFinish = address.value;
      address.value = 'https://example.com/manual-after-destroy.png';
      form.requestSubmit();
      const afterSubmit = image.getAttribute('src');
      await destroyed;
      return { originalAddress, originalImage, afterFinish, afterSubmit, aborted: window.consumerUploadSignal.aborted };
    });
    assert.equal(state.afterFinish, state.originalAddress);
    assert.equal(state.afterSubmit, state.originalImage);
    assert.equal(state.aborted, true);
    assert.equal(await root.locator('.ProseMirror').count(), 0);
    await page.evaluate(async () => {
      document.querySelector('.consumer-upload-test')?.remove();
      delete window.consumerUploadEditor;
      await window.createConsumerUpload();
    });
    await root.locator('.ProseMirror img[alt="original"]').click();
    await root.getByRole('button', { name: '编辑图片' }).click();
    await root.locator('.cherry-milkdown-image-source input[type="file"]').setInputFiles({
      name: 'metadata.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test-image'),
    });
    const duringMetadata = await page.evaluate(async () => {
      const address = document.querySelector(
        '.consumer-upload-test .cherry-milkdown-image-source input[name="source"]',
      );
      const before = address.value;
      let destruction;
      window.consumerUploadFinish('https://example.com/late.png', {
        get name() {
          destruction = window.consumerUploadEditor.destroy();
          return 'late';
        },
      });
      const after = address.value;
      if (!destruction) throw new Error('Metadata was not read');
      await destruction;
      return { before, after, aborted: window.consumerUploadSignal.aborted };
    });
    assert.equal(duringMetadata.after, duringMetadata.before);
    assert.equal(duringMetadata.aborted, true);
    assert.equal(await root.locator('.ProseMirror').count(), 0);
  } finally {
    await page.evaluate(async () => {
      await window.consumerUploadEditor?.destroy();
      document.querySelector('.consumer-upload-test')?.remove();
      delete window.consumerUploadEditor;
    });
    await page.unroute(imageUrl, route);
  }
}
