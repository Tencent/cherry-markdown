import { test, expect, markdown, replaceTableCell, setMarkdown } from './fixtures';
import type { Page } from '@playwright/test';

test('a rollback in one editor leaves another editor and its undo independent', async ({ page }) => {
  await page.goto('/upload-harness.html?serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    window.secondUploadEditor = await window.createUploadEditor();
    window.uploadEditor!.setMarkdown('First', { emit: false });
    window.secondUploadEditor.setMarkdown('Second', { emit: false });
  });
  const editors = page.locator('#editor .ProseMirror');
  await expect(editors).toHaveCount(2);
  await editors.nth(0).locator('p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await editors.nth(1).locator('p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('?');
  await page.evaluate(() => {
    window.installSerializerFailure(1);
    window.uploadEditor!.setMarkdown('External');
    window.restoreSerializer();
  });
  await expect(editors.nth(0)).toHaveText('First!');
  await expect(editors.nth(1)).toHaveText('Second?');
  await expect.poll(() => page.evaluate(() => [...window.uploadChanges].sort())).toEqual(['First!', 'Second?']);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown())).toBe('Second');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('First!');
  await page.evaluate(() => window.uploadEditor!.destroy());
  await editors.first().locator('p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('+');
  await expect.poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown())).toBe('Second+');
  await page.evaluate(() => window.secondUploadEditor!.destroy());
});

test('repeatedly creating and destroying a second editor preserves the surviving editor', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.uploadChanges = [];
    window.uploadEditor!.setMarkdown('Survivor', { emit: false });
  });
  for (let index = 0; index < 8; index++) {
    await page.evaluate(async (value) => {
      window.secondUploadEditor = await window.createUploadEditor();
      window.secondUploadEditor.setMarkdown(value, { emit: false });
    }, `Temporary ${index}`);
    const editors = page.locator('#editor .ProseMirror');
    await expect(editors).toHaveCount(2);
    await editors.last().locator('p').click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await expect.poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown())).toBe(`Temporary ${index}!`);
    await page.evaluate(() => window.secondUploadEditor!.destroy());
    await expect(editors).toHaveCount(1);
    expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Survivor');
  }
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.uploadChanges)).toEqual([]);
  const survivor = page.locator('#editor .ProseMirror p');
  await survivor.click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Survivor!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Survivor');
  expect(errors).toEqual([]);
});

test('destroyed editor nodes and custom resources become collectible while another editor remains active', async ({ page, browserName }) => {
  test.skip(process.env.MILKDOWN_GC_DIAGNOSTICS !== '1', 'Opt-in Chromium garbage-collection diagnostic.');
  test.skip(browserName !== 'chromium', 'This diagnostic uses the Chromium heap protocol.');
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    const WeakReference = (globalThis as unknown as { WeakRef: new (target: object) => { deref(): object | undefined } }).WeakRef;
    const state = window as Window & { editorNodeRefs?: Array<{ deref(): object | undefined }> };
    state.editorNodeRefs = [];
    for (let index = 0; index < 10; index++) {
      const { instance, engine, onError, fileUpload, renderer } = await window.createResourceProbe();
      instance.setMarkdown('[Link](https://example.com)', { emit: false });
      const nodes = document.querySelectorAll('#editor .ProseMirror');
      state.editorNodeRefs.push(new WeakReference(nodes[nodes.length - 1]!));
      state.editorNodeRefs.push(new WeakReference(engine), new WeakReference(onError));
      state.editorNodeRefs.push(new WeakReference(fileUpload), new WeakReference(renderer));
      await instance.destroy();
    }
  });
  const session = await page.context().newCDPSession(page);
  try {
    await page.waitForTimeout(100);
    await session.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(50);
    await session.send('HeapProfiler.collectGarbage');
    const remaining = await page.evaluate(() =>
      (window as Window & { editorNodeRefs?: Array<{ deref(): object | undefined }> }).editorNodeRefs!.filter((ref) => ref.deref()).length,
    );
    expect(remaining).toBe(0);
    await expect(page.locator('#editor .ProseMirror')).toHaveCount(1);
  } finally {
    await session.detach();
  }
});

test('destroyed editors after user typing become collectible while another editor remains active', async ({ page, browserName }) => {
  test.skip(process.env.MILKDOWN_GC_DIAGNOSTICS !== '1', 'Opt-in Chromium garbage-collection diagnostic.');
  test.skip(browserName !== 'chromium', 'This diagnostic uses the Chromium heap protocol.');
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    (window as Window & { typedEditorRefs?: Array<{ deref(): object | undefined }> }).typedEditorRefs = [];
  });
  for (let index = 0; index < 3; index++) {
    await page.evaluate(async () => {
      const { instance } = await window.createResourceProbe();
      window.secondUploadEditor = instance;
      const nodes = document.querySelectorAll('#editor .ProseMirror');
      const WeakReference = (globalThis as unknown as { WeakRef: new (target: object) => { deref(): object | undefined } }).WeakRef;
      (window as Window & { typedEditorRefs?: Array<{ deref(): object | undefined }> }).typedEditorRefs!.push(new WeakReference(nodes[nodes.length - 1]!));
    });
    const item = page.locator('#editor .ProseMirror').last().locator('p');
    await item.click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await expect.poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown())).toBe('Probe!');
    await page.evaluate(async () => { await window.secondUploadEditor!.destroy(); window.secondUploadEditor = undefined; });
  }
  const session = await page.context().newCDPSession(page);
  try {
    await page.waitForTimeout(100);
    await session.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(50);
    await session.send('HeapProfiler.collectGarbage');
    const remaining = await page.evaluate(() =>
      (window as Window & { typedEditorRefs?: Array<{ deref(): object | undefined }> }).typedEditorRefs!.filter((ref) => ref.deref()).length,
    );
    expect(remaining).toBe(0);
  } finally {
    await session.detach();
  }
});

test('editing a surviving instance changes the history cache retention', async ({ page, browserName }) => {
  test.skip(process.env.MILKDOWN_GC_DIAGNOSTICS !== '1', 'Opt-in Chromium garbage-collection diagnostic.');
  test.skip(browserName !== 'chromium', 'This diagnostic uses the Chromium heap protocol.');
  await page.route('https://example.com/**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(async () => {
    window.uploadEditor!.setMarkdown('Survivor', { emit: false });
    const { instance } = await window.createResourceProbe();
    window.secondUploadEditor = instance;
    const nodes = document.querySelectorAll('#editor .ProseMirror');
    const WeakReference = (globalThis as unknown as { WeakRef: new (target: object) => { deref(): object | undefined } }).WeakRef;
    (window as Window & { previousEditorRef?: { deref(): object | undefined } }).previousEditorRef = new WeakReference(nodes[nodes.length - 1]!);
  });
  await page.locator('#editor .ProseMirror').last().locator('p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown())).toBe('Probe!');
  await page.evaluate(async () => { await window.secondUploadEditor!.destroy(); window.secondUploadEditor = undefined; });
  const session = await page.context().newCDPSession(page);
  const collect = async () => {
    await page.waitForTimeout(100);
    await session.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(50);
    await session.send('HeapProfiler.collectGarbage');
  };
  try {
    await collect();
    expect(await page.evaluate(() => Boolean((window as Window & { previousEditorRef?: { deref(): object | undefined } }).previousEditorRef!.deref()))).toBe(true);
    await page.locator('#editor .ProseMirror p').click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Survivor!');
    await collect();
    expect(await page.evaluate(() => Boolean((window as Window & { previousEditorRef?: { deref(): object | undefined } }).previousEditorRef!.deref()))).toBe(false);
  } finally {
    await session.detach();
  }
});

test('inspect typed editor resource retention across repeated destruction', async ({ page, browserName }) => {
  test.skip(process.env.MILKDOWN_GC_DIAGNOSTICS !== '1', 'Opt-in Chromium garbage-collection diagnostic.');
  test.skip(browserName !== 'chromium', 'This diagnostic uses the Chromium heap protocol.');
  await page.goto('/upload-harness.html');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    (window as Window & { resourceGroups?: Array<Record<string, { deref(): object | undefined }>> }).resourceGroups = [];
  });
  for (let index = 0; index < 15; index++) {
    await page.evaluate(async () => {
      const { instance, engine, onError, fileUpload, renderer } = await window.createResourceProbe();
      window.secondUploadEditor = instance;
      const nodes = document.querySelectorAll('#editor .ProseMirror');
      const WeakReference = (globalThis as unknown as { WeakRef: new (target: object) => { deref(): object | undefined } }).WeakRef;
      const groups = (window as Window & { resourceGroups?: Array<Record<string, { deref(): object | undefined }>> }).resourceGroups!;
      groups.push({ node: new WeakReference(nodes[nodes.length - 1]!), engine: new WeakReference(engine), onError: new WeakReference(onError), fileUpload: new WeakReference(fileUpload), renderer: new WeakReference(renderer) });
    });
    const editor = page.locator('#editor .ProseMirror').last().locator('p');
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await expect.poll(() => page.evaluate(() => window.secondUploadEditor!.getMarkdown())).toBe('Probe!');
    await page.evaluate(async () => { await window.secondUploadEditor!.destroy(); window.secondUploadEditor = undefined; });
  }
  const session = await page.context().newCDPSession(page);
  const collect = async () => {
    await page.waitForTimeout(100);
    await session.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(50);
    await session.send('HeapProfiler.collectGarbage');
    return page.evaluate(() =>
      (window as Window & { resourceGroups?: Array<Record<string, { deref(): object | undefined }>> }).resourceGroups!.map((group) =>
        Object.fromEntries(Object.entries(group).map(([name, ref]) => [name, Boolean(ref.deref())])),
      ),
    );
  };
  try {
    const before = await collect();
    expect(before.every(({ engine, onError, fileUpload, renderer }) => !engine && !onError && !fileUpload && !renderer)).toBe(true);
    await page.locator('#editor .ProseMirror p').first().click();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    const after = await collect();
    expect(after.every(({ engine, onError, fileUpload, renderer }) => !engine && !onError && !fileUpload && !renderer)).toBe(true);
    console.log('TYPED_RESOURCE_RETENTION', JSON.stringify({ before, after }));
  } finally {
    await session.detach();
  }
});

test('a no-op external update serializes once and still emits its value', async ({ page }) => {
  await page.goto('/upload-harness.html?notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    window.uploadEditor!.setMarkdown('Same', { emit: false });
    window.installSerializerCounter();
    window.uploadEditor!.setMarkdown('Same');
  });
  expect(await page.evaluate(() => window.serializerCalls)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Same']);
  await page.evaluate(() => window.restoreSerializer());
  await expect(page.locator('.ProseMirror')).toHaveText('Same');
});

test('a no-op update that cannot serialize keeps the pending local change', async ({ page }) => {
  await page.goto('/upload-harness.html?serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => {
    window.installSerializerFailure();
    window.uploadEditor!.setMarkdown('Before!');
    window.restoreSerializer();
  });
  await expect(page.locator('.ProseMirror')).toHaveText('Before!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Before!']);
  expect(await page.evaluate(() => (window as Window & { replacementErrors?: string[] }).replacementErrors)).toEqual([
    'parse: Error: Serialization failed',
  ]);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before');
});

for (const pluginThrows of [false, true]) test(`a plugin transaction during rollback remains visible when plugin throws: ${pluginThrows}`, async ({ page }) => {
  await page.goto(`/upload-harness.html?rollback-local&serialize-replacement-probe&notification-probe${pluginThrows ? '&rollback-local-throw' : ''}`);
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  const value = await page.evaluate(() => {
    (window as Window & { externalReenter?: boolean }).externalReenter = true;
    window.installSerializerFailure(1);
    window.uploadEditor!.setMarkdown('External');
    window.restoreSerializer();
    return window.uploadEditor!.getMarkdown();
  });
  expect(value).toBe('Before!?');
  if (pluginThrows) {
    expect(await page.evaluate(() => (window as Window & { rollbackErrors?: string[] }).rollbackErrors)).toEqual([
      'Error: Serialization failed',
      'Error: Plugin view failed during rollback',
    ]);
  }
  await expect(page.locator('.ProseMirror')).toHaveText('Before!?');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Before!?']);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before!?');
});

for (const pluginThrows of [false, true]) test(`previous local text is available when a rollback plugin replaces it and throws: ${pluginThrows}`, async ({ page }) => {
  await page.goto(`/upload-harness.html?rollback-replace&serialize-replacement-probe&notification-probe${pluginThrows ? '&rollback-local-throw' : ''}`);
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  const values = await page.evaluate(() => {
    (window as Window & { externalReenter?: boolean }).externalReenter = true;
    window.installSerializerFailure(1);
    window.uploadEditor!.setMarkdown('External');
    const previous = window.recoveryContext?.getPreviousMarkdown();
    window.restoreSerializer();
    return { previous, current: window.uploadEditor!.getMarkdown() };
  });
  expect(values).toEqual({ previous: 'Before!', current: 'Plugin' });
  await expect(page.locator('.ProseMirror')).toHaveText('Plugin');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Plugin']);
  await page.evaluate(() => window.uploadEditor!.destroy());
  expect(await page.evaluate(() => window.recoveryContext?.getPreviousMarkdown())).toBe('Before!');
});

test('a newer update started during rollback wins without an obsolete error', async ({ page }) => {
  await page.goto('/upload-harness.html?rollback-reentrant&serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => {
    window.installSerializerFailure(1);
    (window as Window & { externalReenter?: boolean }).externalReenter = true;
    window.uploadEditor!.setMarkdown('External');
  });
  await expect(page.locator('.ProseMirror')).toHaveText('Latest');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Latest');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Latest']);
  expect(
    await page.evaluate(() => (window as Window & { replacementErrors?: string[] }).replacementErrors ?? []),
  ).toEqual([]);
});

test('a failed external serialization preserves local input and its pending notification', async ({ page }) => {
  await page.goto('/upload-harness.html?serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => {
    window.installSerializerFailure();
    window.uploadEditor!.setMarkdown('External');
    window.restoreSerializer();
  });
  expect(await page.evaluate(() => (window as Window & { replacementErrors?: string[] }).replacementErrors)).toEqual([
    'parse: Error: Serialization failed',
  ]);
  await expect(page.locator('.ProseMirror')).toHaveText('Before!');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Before!']);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before');
});

test('serialization failure after external dispatch preserves local input and its notification', async ({ page }) => {
  await page.goto('/upload-harness.html?serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => {
    window.installSerializerFailure(1);
    window.uploadEditor!.setMarkdown('External');
    window.restoreSerializer();
  });
  expect(await page.evaluate(() => (window as Window & { replacementErrors?: string[] }).replacementErrors)).toEqual([
    'parse: Error: Serialization failed',
  ]);
  if (process.env.MILKDOWN_SELECTION_DIAGNOSTICS === '1') {
    await page.waitForTimeout(350);
    console.log(
      'POST_DISPATCH_FAILURE_STATE',
      JSON.stringify(
        await page.evaluate(() => ({
          markdown: window.uploadEditor!.getMarkdown(),
          text: document.querySelector('.ProseMirror')?.textContent,
          notifications: window.uploadChanges,
        })),
      ),
    );
  }
  await expect(page.locator('.ProseMirror')).toHaveText('Before!');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Before!']);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before');
});

test('a plugin document change after a failed replacement is resynchronized without a stale notification', async ({
  page,
}) => {
  await page.goto('/upload-harness.html?external-append-failure&serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  const previousDuringFailure = await page.evaluate(() => {
    window.installSerializerFailure(1);
    window.uploadEditor!.setMarkdown('External');
    const previous = window.recoveryContext!.getPreviousMarkdown();
    window.restoreSerializer();
    return previous;
  });
  expect(previousDuringFailure).toBe('Before!');
  await expect(page.locator('.ProseMirror')).toHaveText('External!');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('External!');
  expect(await page.evaluate(() => window.recoveryContext!.getPreviousMarkdown())).toBe('Before!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['External!']);
  expect(await page.evaluate(() => (window as Window & { replacementErrors?: string[] }).replacementErrors)).toEqual([
    'parse: Error: Serialization failed',
  ]);
});

test('an application can restore local input in the error callback and continue editing', async ({ page }) => {
  await page.goto('/upload-harness.html?external-append-failure&serialize-replacement-probe&notification-probe&restore-in-error-callback');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => {
    window.installSerializerFailure(1);
    window.uploadEditor!.setMarkdown('External');
  });
  await expect(page.locator('.ProseMirror')).toHaveText('Before!');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Before!']);
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('?');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before!?');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Before!');
});

test('recovery preserves a pending list edit without the editor-only tail', async ({ page }) => {
  await page.goto('/upload-harness.html?external-append-failure&serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('* Item\r\n\r\n', { emit: false }));
  await page.locator('.ProseMirror li p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  const before = await page.evaluate(() => window.uploadEditor!.getMarkdown());
  const values = await page.evaluate(() => {
    window.installSerializerFailure(1);
    window.uploadEditor!.setMarkdown('External');
    window.restoreSerializer();
    return { previous: window.recoveryContext!.getPreviousMarkdown(), current: window.uploadEditor!.getMarkdown() };
  });
  expect(values.previous).toBe(before);
  expect(values.previous).toBe('* Item!\r\n\r\n');
  expect(values.previous).not.toContain('<br');
  expect(values.current.trim()).toBe('External!');
  await expect(page.locator('.ProseMirror')).toHaveText('External!');
});

test('a synchronous pending edit remains recoverable while the serializer stays broken', async ({ page }) => {
  await page.goto('/upload-harness.html?external-append-failure&serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  const values = await page.evaluate(() => window.recoverPendingEditDuringFailure());
  expect(values).toEqual({ previous: 'Before!', current: 'External!' });
  await expect(page.locator('.ProseMirror')).toHaveText('External!');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['External!']);
  const afterDestroy = await page.evaluate(async () => {
    await window.uploadEditor!.destroy();
    return window.recoveryContext!.getPreviousMarkdown();
  });
  expect(afterDestroy).toBe('Before!');
});

test('a failed source comparison reconciles the committed plugin document', async ({ page }) => {
  await page.goto('/upload-harness.html?comparison-failure&serialize-replacement-probe&notification-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => window.uploadEditor!.setMarkdown('Before', { emit: false }));
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.evaluate(() => {
    (window as Window & { installComparisonFailure?: () => void }).installComparisonFailure!();
    window.uploadEditor!.setMarkdown('- External');
  });
  await expect(page.locator('.ProseMirror')).toHaveText('External!');
  expect(await page.evaluate(() => window.recoveryContext!.getPreviousMarkdown())).toBe('Before!');
  await page.evaluate(() => window.restoreSerializer());
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('External');
  await expect.poll(() => page.evaluate(() => window.uploadChanges.at(-1))).toContain('External');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('!');
  expect(await page.evaluate(() => (window as Window & { replacementErrors?: string[] }).replacementErrors)).toContain(
    'parse: Error: Comparison serialization failed',
  );
});

test('a reentrant plugin update keeps its previous snapshot after destruction', async ({ page }) => {
  await page.goto('/upload-harness.html?reentrant-snapshot&serialize-replacement-probe');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    const state = window as Window & { externalReenter?: boolean; installReentrantSnapshotFailure?: () => void };
    state.installReentrantSnapshotFailure!();
    state.externalReenter = true;
    window.uploadEditor!.setMarkdown('Middle');
  });
  await expect(page.locator('.ProseMirror')).toHaveText('External!');
  expect(await page.evaluate(() => (window as Window & { replacementErrors?: string[] }).replacementErrors)).toContain(
    'parse: Error: Serialization failed',
  );
  const previous = await page.evaluate(async () => {
    await window.uploadEditor!.destroy();
    return window.recoveryContext!.getPreviousMarkdown();
  });
  expect(previous).toBe('Middle');
});

test('a synchronous plugin update keeps the latest external document and notification', async ({ page }) => {
  await page.goto('/upload-harness.html?external-reentrant');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    (window as Window & { externalReenter?: boolean }).externalReenter = true;
    window.uploadEditor!.setMarkdown('Middle');
  });
  await expect(page.locator('.ProseMirror')).toHaveText('Latest');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Latest');
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Latest']);
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Latest!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Latest');
});

test('a rejected reentrant update preserves the applied external document and notification', async ({ page }) => {
  await page.goto('/upload-harness.html?external-reentrant-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await page.evaluate(() => {
    (window as Window & { externalReenter?: boolean }).externalReenter = true;
    window.uploadEditor!.setMarkdown('Middle');
  });
  await expect(page.locator('.ProseMirror')).toHaveText('Middle');
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Middle');
  expect(
    await page.evaluate(() => (window as Window & { externalReentrantErrors?: string[] }).externalReentrantErrors),
  ).toEqual(['parse: Error: Invalid replacement']);
  await expect.poll(() => page.evaluate(() => window.uploadChanges)).toEqual(['Middle']);
  await page.locator('.ProseMirror p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Middle!');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Middle');
});

async function placeCaretAtTextOffset(page: Page, text: string, offset: number) {
  await page.keyboard.press('ControlOrMeta+End');
  const position = () =>
    page.evaluate(() => ({
      text: window.getSelection()?.anchorNode?.nodeValue,
      offset: window.getSelection()?.anchorOffset,
    }));
  // Native End can stop in the editor-only trailing paragraph. Observe each
  // real arrow-key movement instead of assuming a fixed number of positions.
  for (let count = 0; count < text.length + 3; count += 1) {
    const current = await position();
    if (current.text === text && current.offset === offset) return;
    await page.keyboard.press('ArrowLeft');
  }
  expect(await position()).toEqual({ text, offset });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

test('theme changes refresh charts without replacing table/code chart DOM or the Mermaid source editor', async ({
  page,
}) => {
  const value =
    '# Theme\n\n| :line:{"title":"Table chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```echarts\n{animation:false,title:{text:"Code chart"},xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2],itemStyle:{color:"#c26b00"}}]}\n```\n\n```mermaid\ngraph LR\n A[One]-->B[Two]\n```';
  await setMarkdown(page, value);
  const code = page.locator('.cherry-echarts-codeblock-wrapper');
  const table = page.locator('.cherry-table-chart--derived');
  const diagram = page.locator('.cherry-embed[data-type="mermaid"]');
  const title = code.locator('svg text').filter({ hasText: 'Code chart' });
  await expect(title).toBeVisible();
  await expect(diagram.locator('svg')).toBeVisible();
  const lightTitle = await title.getAttribute('fill');
  const businessColor = code.locator('[fill="#c26b00"], [stroke="#c26b00"]');
  expect(await businessColor.count()).toBeGreaterThan(0);
  const lightStroke = await diagram
    .locator('.node rect')
    .first()
    .evaluate((el) => getComputedStyle(el).stroke);
  const codeHandle = await code.elementHandle();
  const tableHandle = await table.elementHandle();
  await diagram.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = diagram.locator('.cherry-embed__source code');
  await source.click();
  await source.press('End');
  const before = await page.evaluate(() => ({
    node: window.getSelection()?.anchorNode?.textContent,
    offset: window.getSelection()?.anchorOffset,
  }));
  await page.evaluate(() => window.milkdownEditor!.setTheme('dark'));
  await expect.poll(() => title.getAttribute('fill')).not.toBe(lightTitle);
  await expect
    .poll(() =>
      diagram
        .locator('.node rect')
        .first()
        .evaluate((el) => getComputedStyle(el).stroke),
    )
    .not.toBe(lightStroke);
  await expect(source).toBeFocused();
  expect(
    await page.evaluate(() => ({
      node: window.getSelection()?.anchorNode?.textContent,
      offset: window.getSelection()?.anchorOffset,
    })),
  ).toEqual(before);
  expect(await codeHandle!.evaluate((el) => el.isConnected)).toBe(true);
  expect(await tableHandle!.evaluate((el) => el.isConnected)).toBe(true);
  expect(await markdown(page)).toBe(value);
  expect(await businessColor.count()).toBeGreaterThan(0);
  await page.evaluate(() => window.milkdownEditor!.setTheme('default'));
  await expect.poll(() => title.getAttribute('fill')).toBe(lightTitle);
  await expect
    .poll(() =>
      diagram
        .locator('.node rect')
        .first()
        .evaluate((el) => getComputedStyle(el).stroke),
    )
    .toBe(lightStroke);
  await expect(source).toBeFocused();
  expect(await markdown(page)).toBe(value);
});

test('export rebuilds preserve chart content, editing and deletion for both chart kinds', async ({ page }) => {
  const codeSource =
    '{animation:false,title:{text:"Code chart"},xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2]}]}';
  await setMarkdown(
    page,
    '| :line:{"title":"Table chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n' +
      `\`\`\`echarts\n${codeSource}\n\`\`\``,
  );
  const table = page.locator('.cherry-table-chart');
  const code = page.locator('.cherry-embed--cherry_diagram:not([data-type="mermaid"])');
  await expect(table.locator('svg')).toContainText('Table chart');
  await expect(code.locator('svg')).toContainText('Code chart');
  for (let revision = 0; revision < 3; revision += 1) {
    await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
    await expect(table.locator('svg')).toContainText('Table chart');
    await expect(code.locator('svg')).toContainText('Code chart');
  }

  await replaceTableCell(page, page.locator('.milkdown-table-block td p').nth(1), '7');
  await expect(table.locator('.cherry-echarts-wrapper')).toHaveAttribute('data-table-data', /"Sales","7","2"/);
  await code.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = code.locator('.cherry-embed__source code');
  await source.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(codeSource.replace('Code chart', 'Code updated'));
  await expect(code.locator('svg')).toContainText('Code updated');
  await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
  await expect(code.locator('svg')).toContainText('Code updated');
  await expect(table.locator('.cherry-echarts-wrapper')).toHaveAttribute('data-table-data', /"Sales","7","2"/);

  await setMarkdown(page, '| :line:{"title":"Table chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 7 | 2 |');
  await expect(code).toHaveCount(0);
  await expect(table.locator('svg')).toContainText('Table chart');
  await replaceTableCell(page, page.locator('.milkdown-table-block td p').nth(1), '9');
  await expect(table.locator('.cherry-echarts-wrapper')).toHaveAttribute('data-table-data', /"Sales","9","2"/);
  await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
  await expect(table.locator('svg')).toContainText('Table chart');

  await setMarkdown(page, 'Charts removed');
  await expect(page.locator('.cherry-echarts-wrapper')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('cherry:export:done')));
  await expect(page.locator('.cherry-echarts-wrapper')).toHaveCount(0);
  expect(await markdown(page)).toBe('Charts removed');
});

test('native Chromium composition commits Chinese without duplicate text and supports undo', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME pipeline is exercised through its native input protocol.');
  await setMarkdown(page, 'Start');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('ControlOrMeta+End');
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toContainText('nihao');
  await input.send('Input.insertText', { text: '你好' });
  await expect(paragraph).toHaveText('Start你好');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Start你好');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph).toHaveText('Start');
  await input.detach();
});

test('Chromium composition in repeated content preserves surrounding Markdown and undo', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  const prefix = 'Title\r\n=====\r\n\r\n';
  const list = Array.from({ length: 15 }, () => '* Same').join('\r\n');
  const suffix = '\r\n\r\n' + Array.from({ length: 40 }, (_, index) => `Paragraph ${index} with **bold text**.`).join('\r\n\r\n');
  const source = prefix + list + suffix;
  await setMarkdown(page, source);
  const item = page.locator('.ProseMirror li p').last();
  await item.click();
  await page.keyboard.press('End');
  const input = await page.context().newCDPSession(page);
  try {
    await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
    await expect(item).toHaveText('Sameni');
    await input.send('Input.insertText', { text: '你' });
    await expect(item).toHaveText('Same你');
    await expect.poll(() => markdown(page)).toBe(prefix + list + '你' + suffix);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(source);
  } finally {
    await input.detach();
  }
});

test('Chromium composition merges an external prepend in repeated source', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  const prefix = 'Title\r\n=====\r\n\r\n';
  const list = Array.from({ length: 15 }, () => '* Same').join('\r\n');
  const suffix = '\r\n\r\n' + Array.from({ length: 40 }, (_, index) => `Paragraph ${index} with **bold text**.`).join('\r\n\r\n');
  const source = prefix + list + suffix;
  const prepend = 'Remote\r\n\r\n';
  await setMarkdown(page, source);
  const item = page.locator('.ProseMirror li p').last();
  await item.click();
  await page.keyboard.press('End');
  const input = await page.context().newCDPSession(page);
  try {
    await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
    await expect(item).toHaveText('Sameni');
    await page.evaluate((value) => window.milkdownEditor!.setMarkdown(value, { emit: false }), prepend + source);
    await input.send('Input.insertText', { text: '你' });
    await expect.poll(() => markdown(page)).toBe(prepend + prefix + list + '你' + suffix);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => markdown(page)).toBe(prepend + source);
  } finally {
    await input.detach();
  }
});

for (const newer of [false, true]) {
  test(`consecutive native compositions survive ${newer ? 'a newer' : 'an'} external update while the commit frame is delayed`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Chromium IME input protocol; OS candidate selection is verified separately.',
    );
    await setMarkdown(page, '开始：结束');
    const paragraph = page.locator('.ProseMirror > p').first();
    await paragraph.click();
    await placeCaretAtTextOffset(page, '开始：结束', 3);
    const input = await page.context().newCDPSession(page);
    try {
      await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
      await expect(paragraph).toHaveText('开始：ni结束');
      await page.evaluate(() => window.milkdownEditor!.setMarkdown('远程前缀\n\n开始：结束', { emit: false }));
      await page.evaluate(() => {
        const request = window.requestAnimationFrame;
        const cancel = window.cancelAnimationFrame;
        const pending = new Map<number, FrameRequestCallback>();
        let next = -1;
        window.requestAnimationFrame = (callback) => {
          const id = next--;
          pending.set(id, callback);
          return id;
        };
        window.cancelAnimationFrame = (id) => {
          if (!pending.delete(id)) cancel(id);
        };
        (window as Window & { releaseCompositionFrames?: () => number }).releaseCompositionFrames = () => {
          window.requestAnimationFrame = request;
          window.cancelAnimationFrame = cancel;
          const callbacks = [...pending.values()];
          pending.clear();
          callbacks.forEach((callback) => request(callback));
          return callbacks.length;
        };
      });
      await input.send('Input.insertText', { text: '你' });
      await input.send('Input.imeSetComposition', { text: 'hao', selectionStart: 0, selectionEnd: 3 });
      await expect(paragraph).toHaveText('开始：你hao结束');
      if (newer) {
        await page.evaluate(() => {
          const editor = window.milkdownEditor!;
          editor.setMarkdown(`远程新版\n\n${editor.getMarkdown()}`, { emit: false });
          editor.setMarkdown(editor.getMarkdown(), { emit: false });
        });
      }
      await input.send('Input.insertText', { text: '好' });
      await expect(paragraph).toHaveText('开始：你好结束');
      expect(await markdown(page)).toBe('开始：你好结束');
      expect(
        await page.evaluate(
          () => (window as Window & { releaseCompositionFrames?: () => number }).releaseCompositionFrames?.() ?? 0,
        ),
      ).toBeGreaterThan(0);
      const prefix = newer ? '远程新版' : '远程前缀';
      await expect.poll(() => markdown(page)).toBe(`${prefix}\n\n开始：你好结束`);
      expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
      await page.keyboard.type('!');
      await expect.poll(() => markdown(page)).toBe(`${prefix}\n\n开始：你好!结束`);
      await page.keyboard.press('ControlOrMeta+z');
      await expect.poll(() => markdown(page)).not.toBe(`${prefix}\n\n开始：你好!结束`);
      expect(await markdown(page)).toMatch(new RegExp(`^${prefix}\\n\\n开始：(?:你|你好)?结束$`));
      await page.keyboard.press('ControlOrMeta+Shift+z');
      await expect.poll(() => markdown(page)).toBe(`${prefix}\n\n开始：你好!结束`);
    } finally {
      await page.evaluate(() =>
        (window as Window & { releaseCompositionFrames?: () => number }).releaseCompositionFrames?.(),
      );
      await input.detach();
    }
  });
}

test('coalesces an external change before the composing range without discarding committed input', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME pipeline is exercised through its native input protocol.');
  await setMarkdown(page, 'Start');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('ControlOrMeta+End');
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
  await expect(paragraph).toHaveText('Startni');
  await page.evaluate(() => {
    window.milkdownEditor!.setMarkdown('Remote obsolete', { emit: false });
    window.milkdownEditor!.setMarkdown('Remote final', { emit: false });
  });
  await expect(paragraph).toHaveText('Startni');
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toHaveText('Startnihao');
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Remote final你好');
  await expect(paragraph).toHaveText('Remote final你好');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe('Remote final你好'.length);
  await input.detach();
});

test('a conflicting external replacement preserves native composition and undo', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium IME pipeline is exercised through its native input protocol.');
  await setMarkdown(page, '开始：结束');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await placeCaretAtTextOffset(page, '开始：结束', 3);
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
  await expect(paragraph).toHaveText('开始：ni结束');
  await page.evaluate(() => window.milkdownEditor!.setMarkdown('Replace the whole document', { emit: false }));
  await input.send('Input.insertText', { text: '你好' });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('开始：你好结束');
  await expect(paragraph).toHaveText('开始：你好结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(paragraph).toHaveText('开始：结束');
  await input.detach();
});

test('an external prepend received before the first preedit mutation preserves committed input and its caret', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol; OS candidate selection is verified separately.');
  await setMarkdown(page, '开始：结束');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await placeCaretAtTextOffset(page, '开始：结束', 3);
  await page.evaluate(() => {
    document
      .querySelector('.ProseMirror')!
      .addEventListener(
        'compositionupdate',
        () =>
          queueMicrotask(() =>
            window.milkdownEditor!.setMarkdown(`远程前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false }),
          ),
        { capture: true, once: true },
      );
  });
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toHaveText('开始：nihao结束');
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好结束');
  expect(
    await page.evaluate(() => ({
      text: window.getSelection()?.anchorNode?.textContent,
      offset: window.getSelection()?.anchorOffset,
    })),
  ).toEqual({ text: '开始：你好结束', offset: 5 });
  await page.keyboard.type('!');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好!结束');
  await input.detach();
});

test('an external preedit snapshot and subsequent echo preserve Chinese, caret and undo/redo', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol; OS candidate selection is verified separately.');
  await setMarkdown(page, '开始：结束');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await placeCaretAtTextOffset(page, '开始：结束', 3);
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
  await page.evaluate(() => {
    window.milkdownEditor!.setMarkdown(`旧前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false });
    window.milkdownEditor!.setMarkdown(`远程前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false });
    window.milkdownEditor!.setMarkdown(window.milkdownEditor!.getMarkdown(), { emit: false });
  });
  await expect(paragraph).toHaveText('开始：ni结束');
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(3);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('远程前缀\n\n开始：你好结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
  await input.detach();
});

test('external prepend maps the live caret and subsequent typing to its original paragraph', async ({ page }) => {
  await setMarkdown(page, 'First\n\nSecond');
  const paragraph = page.locator('.ProseMirror > p').nth(1);
  await paragraph.click();
  await page.keyboard.press('End');
  await page.evaluate(() => window.milkdownEditor!.setMarkdown('Remote\n\nFirst\n\nSecond', { emit: false }));
  await page.keyboard.type(' edited');
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Remote\n\nFirst\n\nSecond edited');
});

test('external prepend preserves the live paragraph when charts and a trailing Mermaid are present', async ({
  page,
}) => {
  const value =
    '# Heading\n\nFirst\n\n| :line: | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```echarts\n{animation:false,xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2]}]}\n```\n\n```mermaid\ngraph LR\n A-->B\n```';
  await setMarkdown(page, value);
  const paragraph = page.locator('.ProseMirror > p').filter({ hasText: 'First' });
  await paragraph.click();
  await page.keyboard.press('End');
  await page.evaluate((value) => window.milkdownEditor!.setMarkdown(`Remote\n\n${value}`, { emit: false }), value);
  await page.keyboard.type(' edited');
  await expect(paragraph).toHaveText('First edited');
  await expect.poll(() => markdown(page)).toContain('First edited');
  await expect(page.locator('.cherry-table-chart--derived svg')).toBeVisible();
  await expect(page.locator('.cherry-embed[data-type="mermaid"] svg')).toBeVisible();
});

test('a long mixed document supports real editing, selection, formatting, deletion and undo', async ({ page }) => {
  const sections = Array.from(
    { length: 300 },
    (_, index) =>
      `## Section ${index}\n\n${'中文长文档验收，编辑和选区必须保持稳定。'.repeat(6)}${index % 50 === 0 ? '\n\n| :line: | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```mermaid\ngraph LR\n A-->B\n```' : ''}`,
  ).join('\n\n');
  const value = `# Long document\n\n${sections}`;
  expect(value.length).toBeGreaterThan(35_000);
  await setMarkdown(page, value);
  const heading = page.locator('.ProseMirror h2').filter({ hasText: 'Section 250' });
  await heading.scrollIntoViewIfNeeded();
  await heading.click({ clickCount: 3 });
  await page.keyboard.type('Changed 250');
  await expect.poll(() => markdown(page)).toContain('## Changed 250');
  await page.locator('.ProseMirror h2').filter({ hasText: 'Changed 250' }).click({ clickCount: 3 });
  await page.getByRole('toolbar', { name: '文本格式' }).getByRole('button', { name: '加粗' }).click();
  await expect.poll(() => markdown(page)).toContain('**Changed 250**');
  await page.keyboard.press('Backspace');
  await expect.poll(() => markdown(page)).not.toContain('Changed 250');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toContain('Changed 250');
  expect(await page.locator('.ProseMirror h2').count()).toBe(300);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(
    false,
  );
});

test('controlled-value echoes never replay the intermediate composition over committed Chinese', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  await setMarkdown(page, 'Start');
  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await page.keyboard.press('ControlOrMeta+End');
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await expect(paragraph).toHaveText('Startnihao');
  await page.evaluate(() => window.milkdownEditor!.setMarkdown(window.milkdownEditor!.getMarkdown(), { emit: false }));
  await input.send('Input.insertText', { text: '你好' });
  await expect.poll(async () => (await markdown(page)).trimEnd()).toBe('Start你好');
  await expect(paragraph).toHaveText('Start你好');
  await input.detach();
});

test('source boundary shortcuts and range selection stay inside the owned source editor', async ({ page }) => {
  await setMarkdown(page, 'Before\n\n```custom-preview\nAlpha\nBeta\n```\n\nAfter');
  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+Home');
  await page.keyboard.type('X');
  await expect(source).toHaveText('XAlpha\nBeta');
  await source.press('ControlOrMeta+End');
  await page.keyboard.type('Y');
  await expect(source).toHaveText('XAlpha\nBetaY');
  await source.press('ControlOrMeta+Shift+Home');
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('XAlpha\nBetaY');
  await page.keyboard.type('Replaced');
  await expect(source).toHaveText('Replaced');
  await expect
    .poll(async () => (await markdown(page)).trimEnd())
    .toBe('Before\n\n```custom-preview\nReplaced\n```\n\nAfter');
  await expect(source).toBeFocused();
});

test('native composition inside an owned source editor persists exactly one committed Chinese value', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  await setMarkdown(page, '```custom-preview\nStart\n```');
  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+End');
  await expect(source).toBeFocused();
  expect(
    await source.evaluate((element) => {
      const selection = element.ownerDocument.getSelection();
      return Boolean(selection?.focusNode && element.contains(selection.focusNode));
    }),
  ).toBe(true);
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 0, selectionEnd: 5 });
  await input.send('Input.insertText', { text: '你好' });
  await expect(source).toHaveText('Start你好');
  await expect.poll(() => markdown(page)).toContain('Start你好');
  expect((await markdown(page)).match(/你好/g)).toHaveLength(1);
  await expect(page.locator('[data-custom-preview]')).toHaveText('Start你好');
  await expect(source).toBeFocused();
  await input.detach();
});

test('an external prepend keeps the composed source editor focused and updates its renderer', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium IME input protocol.');
  await setMarkdown(page, '```custom-preview\n开始：结束\n```');
  await page.getByRole('button', { name: '在节点内编辑源码' }).click();
  const source = page.locator('.cherry-embed__source code');
  await source.click();
  await source.press('ControlOrMeta+End');
  await source.press('ArrowLeft');
  await source.press('ArrowLeft');
  await expect(source).toBeFocused();
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(3);
  const input = await page.context().newCDPSession(page);
  await input.send('Input.imeSetComposition', { text: 'ni', selectionStart: 0, selectionEnd: 2 });
  await page.evaluate(() =>
    window.milkdownEditor!.setMarkdown(`远程前缀\n\n${window.milkdownEditor!.getMarkdown()}`, { emit: false }),
  );
  await input.send('Input.insertText', { text: '你好' });
  await expect
    .poll(async () => (await markdown(page)).trimEnd())
    .toBe('远程前缀\n\n```custom-preview\n开始：你好结束\n```');
  await expect(source).toHaveText('开始：你好结束');
  await expect(source).toBeFocused();
  await expect(page.locator('[data-custom-preview]')).toHaveText('开始：你好结束');
  expect(await page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(5);
  await input.detach();
});
