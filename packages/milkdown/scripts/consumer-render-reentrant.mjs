import assert from 'node:assert/strict';

/** Ensure a renderer cleanup cannot supersede a newer document revision. */
export async function checkConsumerRenderReentrant(page, editorKey = 'consumerEditor') {
  const block = (value) => `\`\`\`consumer-race\n${value}\n\`\`\``;
  await page.evaluate(({ key, source }) => window[key].setMarkdown(source, { emit: false }), {
    key: editorKey,
    source: block('Old'),
  });
  const preview = page.locator('.cherry-embed--cherry_diagram .cherry-embed__preview');
  await page.waitForFunction(() => document.querySelector('.cherry-embed__preview')?.textContent === 'Old');
  await page.evaluate(
    ({ key, source }) => {
      window.consumerRenderReenter = true;
      window[key].setMarkdown(source, { emit: false });
    },
    { key: editorKey, source: block('Middle') },
  );
  await page.waitForFunction(({ key, source }) => window[key].getMarkdown() === source, {
    key: editorKey,
    source: block('Latest'),
  });
  await page.waitForFunction(() => document.querySelector('.cherry-embed__preview')?.textContent === 'Latest');
  assert.equal(await preview.textContent(), 'Latest');
}

/** A failed render whose abort starts a replacement must not report a stale error. */
export async function checkConsumerFailureReentrant(page, editorKey = 'consumerEditor') {
  const block = (value) => `\`\`\`consumer-race\n${value}\n\`\`\``;
  try {
    await page.evaluate(
      ({ key, source }) => {
        window.expectedMathError = true;
        window.consumerErrors = [];
        window[key].setMarkdown(source, { emit: false });
      },
      { key: editorKey, source: block('Old') },
    );
    await page.waitForFunction(() => document.querySelector('.cherry-embed__preview')?.textContent === 'Old');
    await page.evaluate(
      ({ key, source }) => {
        window.consumerFailureReenter = true;
        window[key].setMarkdown(source, { emit: false });
      },
      { key: editorKey, source: block('Failure') },
    );
    await page.waitForFunction(({ key, source }) => window[key].getMarkdown() === source, {
      key: editorKey,
      source: block('Latest'),
    });
    await page.waitForFunction(() => document.querySelector('.cherry-embed__preview')?.textContent === 'Latest');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.deepEqual(await page.evaluate(() => window.consumerErrors), []);
    assert.equal(await page.locator('.cherry-embed__preview').getAttribute('data-render-error'), null);
  } finally {
    await page.evaluate(() => {
      window.expectedMathError = false;
      window.consumerFailureReenter = false;
    });
  }
}

/** A throwing Engine cleanup must not prevent sibling cleanup or affect another editor. */
export async function checkConsumerEngineCleanup(page) {
  await page.evaluate(() => window.createConsumerEngineCleanup());
  try {
    const previews = page.locator('.consumer-cleanup-test .cherry-embed__preview');
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('.consumer-cleanup-test .cherry-embed__preview')].every((node) =>
          ['First', 'Second'].includes(node.textContent),
        ) && document.querySelectorAll('.consumer-cleanup-test .cherry-embed__preview').length === 2,
    );
    assert.equal(await previews.count(), 2);
    const state = await page.evaluate(async () => {
      const results = await Promise.allSettled([
        window.consumerCleanupEditor.destroy(),
        window.consumerCleanupEditor.destroy(),
      ]);
      return {
        statuses: results.map((result) => result.status),
        cleanups: window.consumerCleanupCount,
        errors: window.consumerCleanupErrors,
      };
    });
    assert.deepEqual(state.statuses, ['fulfilled', 'fulfilled']);
    assert.equal(state.cleanups, 2);
    assert.deepEqual(state.errors, ['render: Error: Engine cleanup failed', 'render: Error: Engine cleanup failed']);
    await page.evaluate(() => window.consumerEditor.setMarkdown('Surviving editor', { emit: false }));
    assert.equal(await page.evaluate(() => window.consumerEditor.getMarkdown()), 'Surviving editor');
  } finally {
    await page.evaluate(async () => {
      await window.consumerCleanupEditor?.destroy().catch(() => {});
      document.querySelector('.consumer-cleanup-test')?.remove();
      delete window.consumerCleanupEditor;
    });
  }
}
