import { expect, test, type Page, type TestInfo } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { cherryCompatibilityCases } from '../src/compatibility';

const demoPath = '/index.html';
const visualPath = '/visual.html';

type BrowserState = {
  cherry: string;
  codeMirror: string;
  milkdown: string;
};

const evidenceByPage = new WeakMap<Page, { actions: string[]; errors: string[] }>();

function captureBrowserErrors(page: Page, actions: string[] = []) {
  const errors: string[] = [];
  evidenceByPage.set(page, { actions, errors });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

async function readState(page: Page): Promise<BrowserState> {
  return page.evaluate(() => {
    const scope = window as typeof window & {
      cherry: {
        getMarkdown(): string;
        getCodeMirror(): { state: { doc: { toString(): string } } };
      };
      milkdownMarkdown?: string;
    };
    return {
      cherry: scope.cherry.getMarkdown(),
      codeMirror: scope.cherry.getCodeMirror().state.doc.toString(),
      milkdown: scope.milkdownMarkdown ?? '',
    };
  });
}

async function attachEvidence(page: Page, testInfo: TestInfo, actions: string[], errors: string[]) {
  let state: BrowserState | undefined;
  try {
    state = await readState(page);
  } catch {
    // The page may have already closed after a browser-level failure.
  }
  await testInfo.attach('milkdown-reliability-evidence.json', {
    body: Buffer.from(
      JSON.stringify(
        { seed: process.env.MILKDOWN_E2E_SEED ?? testInfo.repeatEachIndex, actions, errors, state },
        null,
        2,
      ),
    ),
    contentType: 'application/json',
  });
}

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const evidence = evidenceByPage.get(page) ?? { actions: [], errors: [] };
  await attachEvidence(page, testInfo, evidence.actions, evidence.errors);
});

test('table ECharts renders, updates and keeps all Markdown owners in sync', async ({ page }, testInfo) => {
  const errors = captureBrowserErrors(page);
  const actions: string[] = [];
  evidenceByPage.set(page, { actions, errors });
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await expect(page.locator('.ProseMirror')).toBeVisible();
  actions.push('opened full Cherry demo');

  const chart = page.locator('.cherry-table-chart:visible').first();
  await expect(chart).toBeVisible();
  await chart.scrollIntoViewIfNeeded();
  const wrapper = chart.locator('.cherry-echarts-wrapper').first();
  await expect(wrapper).toBeVisible();
  await expect(wrapper.locator('svg')).toHaveCount(1);
  actions.push('observed native SVG table chart');

  const chartBox = await chart.boundingBox();
  if (!chartBox) throw new Error('Missing table chart box');
  await page.mouse.move(chartBox.x + chartBox.width - 8, chartBox.y + 8);
  await chart.getByRole('button', { name: '在节点内编辑表格图表源码' }).click({ timeout: 5_000 });
  await expect(chart).toHaveClass(/is-(selected|editing)/);
  const source = chart.locator('.cherry-table-chart__source code');
  await expect(source).toBeVisible();
  const updatedSource = [
    '| :line:{"title":"E2E Reliability"} | Jan | Feb |',
    '| --- | ---: | ---: |',
    '| Series A | 11 | 42 |',
  ].join('\n');
  await source.fill(updatedSource, { timeout: 5_000 });
  actions.push('edited table chart source in place');

  await expect
    .poll(
      async () => {
        const state = await readState(page);
        return {
          synchronized: state.cherry === state.codeMirror && state.cherry === state.milkdown,
          containsUpdate: state.cherry.includes(updatedSource),
        };
      },
      { timeout: 10_000 },
    )
    .toEqual({ synchronized: true, containsUpdate: true });
  await expect(wrapper.locator('svg')).toHaveCount(1);
  const option = await wrapper.evaluate((element) => {
    const scope = window as typeof window & {
      echarts: { getInstanceByDom(dom: HTMLElement): { getOption(): unknown } | undefined };
    };
    return scope.echarts.getInstanceByDom(element as HTMLElement)?.getOption();
  });
  expect(JSON.stringify(option)).toContain('E2E Reliability');
  expect(JSON.stringify(option)).toContain('42');
  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('the full demo loads every shared image and keeps images selectable in preview', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));

  const images = page.locator('.ProseMirror img:not(.ProseMirror-separator)');
  expect(await images.count()).toBeGreaterThanOrEqual(15);
  await expect(page.locator('.ProseMirror img[alt="表格图表"]')).toBeVisible();
  await expect(page.locator('.ProseMirror img[alt="字体样式"]')).toBeVisible();
  const broken = await images.evaluateAll((elements) =>
    elements
      .filter((element) => {
        const image = element as HTMLImageElement;
        return !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0;
      })
      .map((element) => (element as HTMLImageElement).currentSrc || element.getAttribute('src')),
  );
  expect(broken).toEqual([]);
  actions.push(`loaded ${await images.count()} shared demo images with intrinsic dimensions`);

  const feature = page.locator('.ProseMirror img[alt="表格图表"]');
  const before = await readState(page);
  await feature.click();
  await expect(feature).toHaveClass(/ProseMirror-selectednode/);
  await expect.poll(async () => await readState(page)).toEqual(before);
  actions.push('selected a rendered feature image without changing Markdown state');

  const nestedFontLink = page
    .locator('.ProseMirror a[href="http://www.qq.com"]')
    .filter({ hasText: '黑底白字超链接' })
    .first();
  await expect(nestedFontLink).toHaveText('黑底白字超链接');
  await expect(nestedFontLink.locator('.cherry-wysiwyg-color')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(nestedFontLink.locator('.cherry-wysiwyg-bg')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  actions.push('rendered nested foreground and background font styles without leaking Markdown markers');

  const nativeLineChart = page
    .locator('.cherry-embed--cherry_native_block')
    .filter({ hasText: '示例（折线图）' })
    .first();
  await nativeLineChart.scrollIntoViewIfNeeded();
  await expect(nativeLineChart.locator('.cherry-echarts-wrapper svg')).toHaveCount(1);
  actions.push('rendered the table ECharts nested inside the native two-column example');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('rapid inline-code editing never rolls back and mode/API updates stay consistent', async ({ page }, testInfo) => {
  const errors = captureBrowserErrors(page);
  const actions: string[] = [];
  evidenceByPage.set(page, { actions, errors });
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('Rapid `seed` tail.');
  });
  const inlineCode = page.locator('.ProseMirror code').filter({ hasText: /^seed$/ });
  await expect(inlineCode).toHaveCount(1);

  await inlineCode.click();
  await page.keyboard.press('ArrowLeft');
  let typed = '';
  let previousLength = (await readState(page)).cherry.length;
  for (let index = 0; index < 100; index += 1) {
    const character = String.fromCharCode(97 + (index % 26));
    typed += character;
    await page.keyboard.insertText(character);
    await page.waitForTimeout(5);
    const markdown = (await readState(page)).cherry;
    expect(markdown.length).toBeGreaterThan(previousLength);
    expect(markdown).toMatch(new RegExp('`[^`]*' + typed + '[^`]*`'));
    previousLength = markdown.length;
  }
  actions.push('inserted 100 inline-code characters at 5ms intervals with monotonic assertions');

  await expect
    .poll(async () => {
      const state = await readState(page);
      return state.cherry === state.codeMirror && state.cherry === state.milkdown;
    })
    .toBe(true);
  const rapidState = await readState(page);
  expect(rapidState.cherry).toMatch(new RegExp('`[^`]*' + typed + '[^`]*`'));

  await page.evaluate(() => {
    const scope = window as typeof window & {
      cherry: { switchModel(model: 'edit&preview' | 'editOnly' | 'previewOnly'): void };
    };
    for (let index = 0; index < 20; index += 1) {
      scope.cherry.switchModel(index % 2 ? 'edit&preview' : 'editOnly');
    }
    scope.cherry.switchModel('edit&preview');
  });
  await expect(page.locator('.ProseMirror')).toHaveCount(1);
  actions.push('switched mode 20 times without recreating Milkdown');

  const apiMarkdown = '# API update after mode stress\n\n`stable`';
  await page.evaluate((markdown) => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue(markdown);
  }, apiMarkdown);
  await expect
    .poll(async () => {
      const state = await readState(page);
      return { cherry: state.cherry, codeMirror: state.codeMirror };
    })
    .toEqual({ cherry: apiMarkdown, codeMirror: apiMarkdown });
  await expect(page.locator('.ProseMirror h1')).toHaveText('API update after mode stress');
  await expect(page.locator('.ProseMirror code')).toHaveText('stable');
  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('Cherry toolbar and search operate on the focused Milkdown surface', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('Toolbar bridge text.');
  });

  const paragraph = page.locator('.ProseMirror p', { hasText: 'Toolbar bridge text.' });
  await expect(paragraph).toBeVisible();
  await paragraph.click({ position: { x: 8, y: 10 } });
  for (let index = 0; index <= 'Toolbar bridge text.'.length; index += 1) await page.keyboard.press('ArrowLeft');
  for (let index = 0; index < 'Toolbar'.length; index += 1) await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(() => page.evaluate(() => getSelection()?.toString())).toBe('Toolbar');
  await page.locator('.toolbar-left [title="加粗"]').click();
  await expect
    .poll(async () => {
      const state = await readState(page);
      return { synchronized: state.cherry === state.codeMirror, markdown: state.cherry.trim() };
    })
    .toEqual({ synchronized: true, markdown: '**Toolbar** bridge text.' });
  actions.push('selected preview text and applied Cherry bold toolbar command');

  await page.locator('.toolbar-left [title="搜索/替换"]').click();
  await page.locator('.cherry-searcher__input').fill('bridge');
  await expect(page.locator('.cherry-searcher__counter')).toHaveText('1/1');
  actions.push('searched the focused Milkdown document with Cherry search UI');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('heading toggles back to paragraph and code blocks stay in the preview editor', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('Editable block');
  });

  const paragraph = page.locator('.ProseMirror p', { hasText: 'Editable block' });
  await paragraph.click();
  const headingMenu = page.locator('.cherry-toolbar-header');
  await headingMenu.dispatchEvent('pointerdown', { pointerType: 'mouse' });
  await headingMenu.dispatchEvent('pointerup', { pointerType: 'mouse' });
  await page.locator('.cherry-dropdown[name="header"] [title="一级标题"]').click();
  await expect(page.locator('.ProseMirror h1')).toHaveText('Editable block');
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('# Editable block');
  actions.push('changed paragraph to H1 in the preview surface');

  await headingMenu.dispatchEvent('pointerdown', { pointerType: 'mouse' });
  await headingMenu.dispatchEvent('pointerup', { pointerType: 'mouse' });
  await expect(page.locator('.cherry-dropdown[name="header"] [title="一级标题"]')).toHaveClass(
    /cherry-dropdown-item__selected/,
  );
  await page.locator('.cherry-dropdown[name="header"] [title="一级标题"]').click();
  await expect(page.locator('.ProseMirror p')).toHaveText('Editable block');
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('Editable block');
  await headingMenu.dispatchEvent('pointerdown', { pointerType: 'mouse' });
  await headingMenu.dispatchEvent('pointerup', { pointerType: 'mouse' });
  await expect(page.locator('.cherry-dropdown[name="header"] .cherry-dropdown-item__selected')).toHaveCount(0);
  await headingMenu.dispatchEvent('pointerdown', { pointerType: 'mouse' });
  await headingMenu.dispatchEvent('pointerup', { pointerType: 'mouse' });
  actions.push('selected H1 again and returned it to paragraph');

  const insertMenu = page.locator('.cherry-toolbar-insert');
  await insertMenu.dispatchEvent('pointerdown', { pointerType: 'mouse' });
  await insertMenu.dispatchEvent('pointerup', { pointerType: 'mouse' });
  await page.locator('.cherry-dropdown[name="insert"] [title="代码块"]').click();
  const codeBlock = page.locator('.ProseMirror .cherry-milkdown-code-block');
  await expect(codeBlock).toBeVisible();
  await expect(page.locator('.cherry-editor .cm-content')).not.toBeFocused();
  await codeBlock.locator('code').click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('const next = 2;');
  await codeBlock.locator('select[aria-label="代码语言"]').selectOption('javascript');
  await expect
    .poll(async () => {
      const state = await readState(page);
      return {
        synchronized: state.cherry === state.codeMirror && state.cherry === state.milkdown,
        markdown: state.cherry.trim(),
      };
    })
    .toEqual({
      synchronized: true,
      markdown: '```javascript\nEditable block\nconst next = 2;\n```',
    });
  actions.push('converted the current block to code, edited it in place, and changed its language');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('slash menu exposes H6 and keyboard code-block conversion without leaving preview', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));

  const setMarkdown = (value: string) =>
    page.evaluate((next) => {
      const scope = window as typeof window & { cherry: { setValue(markdown: string): void } };
      scope.cherry.setValue(next);
    }, value);

  await setMarkdown('');
  await page.locator('.ProseMirror p').click();
  await page.keyboard.insertText('/');
  const slashMenu = page.locator('.cherry-milkdown-slash');
  await expect(slashMenu).toBeVisible();
  await slashMenu.getByRole('option', { name: '标题 6' }).click();
  await page.keyboard.insertText('Sixth level');
  await expect(page.locator('.ProseMirror h6')).toHaveText('Sixth level');
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('###### Sixth level');
  actions.push('created and edited H6 through the caret-anchored slash menu');

  await setMarkdown('');
  await page.locator('.ProseMirror p').click();
  await page.keyboard.insertText('/');
  await expect(slashMenu).toBeVisible();
  for (let index = 0; index < 7; index += 1) await page.keyboard.press('ArrowDown');
  await expect(slashMenu.getByRole('option', { name: '代码块' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('slashCode();');
  await expect(page.locator('.ProseMirror .cherry-milkdown-code-block code')).toHaveText('slashCode();');
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('```\nslashCode();\n```');
  await expect(page.locator('.cherry-editor .cm-content')).not.toBeFocused();
  actions.push('used arrow keys and Enter to create a directly editable code block without focusing CodeMirror');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('native and unfocused Milkdown previews satisfy the 0.5% visual contract', async ({ page }, testInfo) => {
  const errors = captureBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(visualPath);
  await page.evaluate(() => (window as typeof window & { visualReady: Promise<void> }).visualReady);

  const components = [
    { id: 'heading', native: '#native .cherry-previewer h1', milkdown: '#milkdown .ProseMirror h1' },
    { id: 'paragraph', native: '#native .cherry-previewer > p', milkdown: '#milkdown .ProseMirror > p' },
    { id: 'blockquote', native: '#native blockquote', milkdown: '#milkdown blockquote' },
    { id: 'table', native: '#native table', milkdown: '#milkdown table' },
    { id: 'panel', native: '#native .cherry-panel', milkdown: '#milkdown .cherry-panel' },
    { id: 'detail', native: '#native details', milkdown: '#milkdown details' },
    {
      id: 'code-block',
      native: '#native [data-type="codeBlock"]',
      milkdown: '#milkdown [data-type="codeBlock"]',
    },
  ];
  const layout: Array<{
    id: string;
    native: { top: number; bottom: number };
    milkdown: { top: number; bottom: number };
  }> = [];
  for (const component of components) {
    const nativeLocator = page.locator(component.native).first();
    const milkdownLocator = page.locator(component.milkdown).first();
    await expect(nativeLocator, component.id).toBeVisible();
    await expect(milkdownLocator, component.id).toBeVisible();
    const nativeScreenshot = await nativeLocator.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath(`${component.id}-native.png`),
    });
    const milkdownScreenshot = await milkdownLocator.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath(`${component.id}-milkdown.png`),
    });
    const nativeImage = PNG.sync.read(nativeScreenshot);
    const milkdownImage = PNG.sync.read(milkdownScreenshot);
    expect({ width: milkdownImage.width, height: milkdownImage.height }, `${component.id} dimensions`).toEqual({
      width: nativeImage.width,
      height: nativeImage.height,
    });
    const diff = new PNG({ width: nativeImage.width, height: nativeImage.height });
    const changedPixels = pixelmatch(
      nativeImage.data,
      milkdownImage.data,
      diff.data,
      nativeImage.width,
      nativeImage.height,
      { threshold: 0.1, includeAA: false },
    );
    await testInfo.attach(`${component.id}-pixel-diff.png`, {
      body: PNG.sync.write(diff),
      contentType: 'image/png',
    });
    expect(changedPixels / (nativeImage.width * nativeImage.height), component.id).toBeLessThanOrEqual(0.005);
    const nativeBox = await nativeLocator.boundingBox();
    const milkdownBox = await milkdownLocator.boundingBox();
    if (!nativeBox || !milkdownBox) throw new Error(`Missing visual box for ${component.id}`);
    layout.push({
      id: component.id,
      native: { top: nativeBox.y, bottom: nativeBox.y + nativeBox.height },
      milkdown: { top: milkdownBox.y, bottom: milkdownBox.y + milkdownBox.height },
    });
  }
  const stylePairs = await page.evaluate(() => {
    const properties = [
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'color',
      'margin-top',
      'margin-bottom',
      'padding-top',
      'padding-bottom',
      'border-top-width',
      'border-top-color',
    ];
    return ['h1', 'p', 'blockquote', 'table', 'pre'].map((selector) => {
      const native = document.querySelector(`#native .cherry-previewer ${selector}`);
      const milkdown = document.querySelector(`#milkdown .ProseMirror ${selector}`);
      if (!native || !milkdown) throw new Error(`Missing visual contract selector: ${selector}`);
      const nativeStyle = getComputedStyle(native);
      const milkdownStyle = getComputedStyle(milkdown);
      return {
        selector,
        native: properties.map((property) => nativeStyle.getPropertyValue(property)),
        milkdown: properties.map((property) => milkdownStyle.getPropertyValue(property)),
      };
    });
  });
  for (const pair of stylePairs) expect(pair.milkdown, pair.selector).toEqual(pair.native);
  for (let index = 1; index < layout.length; index += 1) {
    const previous = layout[index - 1]!;
    const current = layout[index]!;
    const nativeGap = current.native.top - previous.native.bottom;
    const milkdownGap = current.milkdown.top - previous.milkdown.bottom;
    expect(Math.abs(milkdownGap - nativeGap), `${previous.id} -> ${current.id} gap`).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test('the shared Cherry syntax matrix renders in the real demo without renderer errors', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));

  for (const capability of cherryCompatibilityCases) {
    await page.evaluate((markdown) => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue(markdown);
    }, capability.markdown);
    await expect.poll(async () => (await readState(page)).codeMirror).toBe(capability.markdown);
    if (capability.selector) {
      await expect(page.locator(`.ProseMirror ${capability.selector}`).first(), capability.id).toBeVisible();
    } else {
      await expect(page.locator('.ProseMirror')).toContainText('red');
    }
    const markdown = (await readState(page)).cherry;
    expect(markdown.length, capability.id).toBeGreaterThan(0);
    actions.push(`rendered ${capability.id} as ${capability.mode}`);
  }

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('repeated mount and destroy returns DOM and heap resources to the warmed baseline', async ({
  page,
  browserName,
}, testInfo) => {
  test.setTimeout(90_000);
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(visualPath);
  await page.evaluate(() => (window as typeof window & { visualReady: Promise<void> }).visualReady);
  const rounds = Number(process.env.MILKDOWN_STRESS_ROUNDS ?? 10);

  const readHeap = async () => {
    if (browserName !== 'chromium') return undefined;
    const session = await page.context().newCDPSession(page);
    await session.send('HeapProfiler.collectGarbage');
    const usage = (await session.send('Runtime.getHeapUsage')) as { usedSize: number };
    await session.detach();
    return usage.usedSize;
  };

  await page.evaluate(async () => {
    const scope = window as typeof window & {
      Cherry: new (options: Record<string, unknown>) => { destroy(): void };
      milkdown: (options?: Record<string, unknown>) => unknown;
    };
    const host = document.createElement('div');
    document.body.append(host);
    const instance = new scope.Cherry({
      el: host,
      value: '# warmup',
      editor: { defaultModel: 'previewOnly' },
      toolbars: { toolbar: false, toolbarRight: false, sidebar: false },
      extensions: [scope.milkdown({ debounce: 0 })],
    });
    while (!host.querySelector('.ProseMirror')) await new Promise(requestAnimationFrame);
    instance.destroy();
    host.remove();
    await new Promise(requestAnimationFrame);
  });
  const baselineHeap = await readHeap();
  const baseline = await page.locator('body *').count();

  const final = await page.evaluate(async (mountRounds) => {
    const scope = window as typeof window & {
      Cherry: new (options: Record<string, unknown>) => { destroy(): void };
      milkdown: (options?: Record<string, unknown>) => unknown;
    };
    for (let index = 0; index < mountRounds; index += 1) {
      const host = document.createElement('div');
      host.dataset.stressHost = String(index);
      document.body.append(host);
      const instance = new scope.Cherry({
        el: host,
        value: `# stress ${index}\n\n| A | B |\n| --- | --- |\n| ${index} | value |`,
        editor: { defaultModel: 'previewOnly' },
        toolbars: { toolbar: false, toolbarRight: false, sidebar: false },
        extensions: [scope.milkdown({ debounce: 0 })],
      });
      while (!host.querySelector('.ProseMirror')) await new Promise(requestAnimationFrame);
      instance.destroy();
      host.remove();
      await new Promise(requestAnimationFrame);
    }
    await new Promise(requestAnimationFrame);
    return {
      editors: document.querySelectorAll('.ProseMirror').length,
      stressHosts: document.querySelectorAll('[data-stress-host]').length,
      elements: document.querySelectorAll('body *').length,
    };
  }, rounds);
  actions.push(`mounted and destroyed ${rounds} real Cherry + Milkdown instances`);

  expect(final.stressHosts).toBe(0);
  expect(final.editors).toBe(1);
  expect(final.elements).toBeLessThanOrEqual(baseline);
  if (process.env.MILKDOWN_HEAP_GATE && baselineHeap !== undefined) {
    const finalHeap = await readHeap();
    expect(finalHeap, 'retained Chromium heap').toBeLessThanOrEqual(baselineHeap + 15 * 1024 * 1024);
  }
  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});
