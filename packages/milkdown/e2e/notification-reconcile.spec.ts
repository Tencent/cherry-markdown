import { expect, test } from '@playwright/test';

test('an image Engine error never restores an unsafe image URL', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?image-engine-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    (window as Window & { insertImageProbe?: (src: string) => void }).insertImageProbe!('javascript:alert(1)');
  });
  await expect(page.locator('.ProseMirror img[alt="probe"]')).not.toHaveAttribute('src');
});

test('an image Engine error does not prevent editing and can recover on the next update', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?image-engine-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const image = page.locator('.ProseMirror img:not(.ProseMirror-separator)').first();
  await expect(image).toHaveAttribute('src', 'https://example.com/original.png');
  expect(await page.evaluate(() => (window as Window & { imageEngineErrors?: string[] }).imageEngineErrors)).toContain(
    'render: Error: Image engine failed',
  );
  await page.evaluate(() => {
    (window as Window & { imageEngineFail?: boolean }).imageEngineFail = false;
    window.uploadEditor!.setMarkdown('Text\n\n![picture](https://example.com/updated.png)');
  });
  await expect(image).toHaveAttribute('src', 'https://example.com/recovered.png');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' added');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Text added');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Text\n\n');
});

for (const [kind, updated, selector] of [
  ['emoji', ':heart:', '.cherry-embed--cherry_emoji .cherry-embed__preview'],
  ['native', ':::business-card\nUpdated\n:::', '.cherry-embed--cherry_native_block .cherry-embed__preview'],
] as const) {
  test(`a custom engine cannot replace ${kind} after destroying the editor`, async ({ page }) => {
    await page.goto(`/upload-harness.html?engine-destroy-${kind}-probe`);
    await page.waitForFunction(() => Boolean(window.uploadEditor));
    const outcome = await page.evaluate(
      async ({ updated, selector }) => {
        const state = window as Window & { destroyInEngine?: boolean; engineDestruction?: Promise<void> };
        const target = document.querySelector(selector);
        if (!target) throw new Error('Missing expected preview');
        state.destroyInEngine = true;
        window.uploadEditor!.setMarkdown(updated);
        const content = target.textContent;
        const mountedContent = document.querySelector(selector)?.textContent;
        if (!state.engineDestruction) throw new Error('Engine did not request destruction');
        await state.engineDestruction;
        return { content, mountedContent, remaining: document.querySelectorAll('#editor .ProseMirror').length };
      },
      { updated, selector },
    );
    expect(outcome).toEqual({ content: 'initial result', mountedContent: 'initial result', remaining: 0 });
  });
}

test('a custom engine cannot replace image presentation after destroying the editor', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?engine-destroy-image-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const outcome = await page.evaluate(async () => {
    const state = window as Window & { destroyInEngine?: boolean; engineDestruction?: Promise<void> };
    const image = document.querySelector<HTMLImageElement>('.ProseMirror img')!;
    state.destroyInEngine = true;
    window.uploadEditor!.setMarkdown('![updated](https://example.com/updated.png)');
    const source = image.getAttribute('src');
    if (!state.engineDestruction) throw new Error('Engine did not request destruction');
    await state.engineDestruction;
    return { source, remaining: document.querySelectorAll('#editor .ProseMirror').length };
  });
  expect(outcome).toEqual({ source: 'https://example.com/initial.png', remaining: 0 });
});

test('a custom engine cannot commit a result after it destroys the editor', async ({ page }) => {
  await page.goto('/upload-harness.html?engine-destroy-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const outcome = await page.evaluate(async () => {
    const state = window as Window & { destroyInEngine?: boolean; engineDestruction?: Promise<void> };
    state.destroyInEngine = true;
    window.uploadEditor!.setMarkdown('<div>\nUpdated\n</div>');
    const preview = document.querySelector('.cherry-embed__preview')?.textContent;
    if (!state.engineDestruction) throw new Error('Engine did not request destruction');
    await state.engineDestruction;
    return { preview, remaining: document.querySelectorAll('#editor .ProseMirror').length };
  });
  expect(outcome).toEqual({ preview: 'initial result', remaining: 0 });
});

test('repeated composition end events do not apply external changes during a restarted composition', async ({
  page,
}) => {
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    const editor = window.uploadEditor!;
    editor.setMarkdown('Start', { emit: false });
    const surface = document.querySelector('.ProseMirror')!;
    const event = (name: string) => surface.dispatchEvent(new CompositionEvent(name, { bubbles: true }));
    event('compositionstart');
    editor.setMarkdown('Remote\n\nStart', { emit: false });
    event('compositionend');
    event('compositionend');
    event('compositionstart');
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Start');
  await page.evaluate(() =>
    document.querySelector('.ProseMirror')!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })),
  );
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Remote\n\nStart');
});

test('a silent same-value echo does not discard a pending local change notification', async ({ page }) => {
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Start', { emit: false }));
  const paragraph = page.locator('.ProseMirror > p').last();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type('x');
  await page.evaluate(() => window.uploadEditor!.setMarkdown(window.uploadEditor!.getMarkdown(), { emit: false }));
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Startx']);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Startx');
});

test('a silent different-value replacement still cancels a pending local notification', async ({ page }) => {
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Start', { emit: false }));
  const paragraph = page.locator('.ProseMirror > p').last();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type('x');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Replacement', { emit: false }));
  await expect(paragraph).toHaveText('Replacement');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Replacement');
});

test('an emitting same-value update still reports a change', async ({ page }) => {
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.uploadEditor!.setMarkdown('Start', { emit: false });
    window.uploadEditor!.setMarkdown('Start');
  });
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Start']);
});

test('rapid keyboard edits and silent external prepends report the final document', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Start', { emit: false }));
  const paragraph = page.locator('.ProseMirror > p').last();
  await paragraph.click();
  await page.keyboard.press('End');
  for (let revision = 0; revision < 5; revision += 1) {
    await page.keyboard.type('a');
    const before = await page.evaluate(() => window.uploadEditor!.getMarkdown());
    const next = `Remote ${revision}\n\n${before}`;
    await page.evaluate((markdown) => window.uploadEditor!.setMarkdown(markdown, { emit: false }), next);
    await page.keyboard.type('b');
    const expected = `${next}b`;
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(expected);
    await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1))).toBe(expected);
    await expect(page.locator('.ProseMirror > p').last()).toHaveText(`Start${'ab'.repeat(revision + 1)}`);
  }
  expect(errors).toEqual([]);
});

test('undo and redo preserve an external prepend between local edits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Start', { emit: false }));
  await page.locator('.ProseMirror > p').last().click();
  await page.keyboard.press('End');
  await page.keyboard.type('alpha');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Remote\n\nStartalpha', { emit: false }));
  await page.keyboard.type('beta');
  const latest = 'Remote\n\nStartalphabeta';
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(latest);
  let steps = 0;
  let value = latest;
  while (value !== 'Remote\n\nStart' && steps < 2) {
    await page.keyboard.press('ControlOrMeta+z');
    steps += 1;
    value = await page.evaluate(() => window.uploadEditor!.getMarkdown());
    expect(value.startsWith('Remote\n\nStart')).toBe(true);
  }
  expect(value).toBe('Remote\n\nStart');
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1))).toBe(value);
  for (let count = 0; count < steps; count += 1) await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe(latest);
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1))).toBe(latest);
  expect(errors).toEqual([]);
});

test('undo after an external replacement never restores a stale terminal newline convention', async ({ page }) => {
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Text', { emit: false }));
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.type('local');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Textlocal');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Remote\n\nTextlocal\n\n', { emit: false }));
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Remote\n\nText\n\n');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Remote\n\nTextlocal\n\n');
});
