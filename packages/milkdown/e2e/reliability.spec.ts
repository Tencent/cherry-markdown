import { expect, test, type Page, type TestInfo } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { cherryCompatibilityCases } from '../test/fixtures/compatibility';

const demoPath = '/index.html';
const previewOnlyPath = '/preview-only.html';
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

  // Lazy chart NodeViews reserve a zero-area wrapper until they enter the
  // viewport; select the node first, then scroll it into view to activate it.
  const chart = page.locator('.cherry-table-chart').first();
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toBeVisible();
  const wrapper = chart.locator('.cherry-echarts-wrapper').first();
  await expect(wrapper).toBeVisible();
  await expect(wrapper.locator('svg')).toHaveCount(1);
  await expect
    .poll(async () =>
      chart.evaluate((element) => ({
        shellMargin: getComputedStyle(element).margin,
        nativeFigureMargin: getComputedStyle(element.querySelector('.cherry-table-figure')!).margin,
      })),
    )
    .toEqual({ shellMargin: '0px', nativeFigureMargin: '16px 0px' });
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

  const resizable = page.locator('.ProseMirror img[src$="demo-dog.png"]').first();
  await resizable.scrollIntoViewIfNeeded();
  await expect(resizable).toHaveCSS('width', '100px');
  await resizable.click();
  const resizePoints = page.locator('.cherry-previewer-img-size-handler__points');
  await expect(resizePoints).toHaveCount(8);
  await expect(page.locator('.cherry-previewer-img-tool-handler .img-tool-button')).toHaveCount(8);

  const corner = page.locator('.cherry-previewer-img-size-handler__points-rightBottom');
  const box = await corner.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 30, box!.y + box!.height / 2 + 30, { steps: 4 });
  await page.mouse.up();
  await expect(resizable).toHaveAttribute('alt', /一条dog#\d+px#\d+px/);
  await page.locator('.cherry-previewer-img-tool-handler [title="边框"]').click();
  await expect(resizable).toHaveClass(/cherry-img-deco-border/);
  await expect(resizable).toHaveCSS('border-top-style', 'solid');
  await expect.poll(async () => {
    const state = await readState(page);
    return state.cherry === state.codeMirror && state.cherry === state.milkdown && /一条dog#\d+px#\d+px#B/.test(state.cherry);
  }).toBe(true);
  actions.push('resized and decorated a preview image with Cherry native controls while keeping Markdown synchronized');

  const nestedFontLink = page
    .locator('.ProseMirror a[href="http://www.qq.com"]')
    .filter({ hasText: '黑底白字超链接' })
    .first();
  await expect(nestedFontLink).toHaveText('黑底白字超链接');
  await expect(nestedFontLink.locator('.cherry-wysiwyg-color')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(nestedFontLink.locator('.cherry-wysiwyg-bg')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  actions.push('rendered nested foreground and background font styles without leaking Markdown markers');

  const nativeLineChart = page
    .locator('.cherry-compound--cols')
    .filter({ hasText: '示例（折线图）' })
    .first();
  await nativeLineChart.scrollIntoViewIfNeeded();
  await expect(nativeLineChart.locator('.cherry-echarts-wrapper svg')).toHaveCount(1);
  actions.push('rendered the table ECharts nested inside the native two-column example');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('Mermaid keeps Cherry native resize and alignment controls in the preview editor', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('```mermaid\ngraph TD\n  Start --> Finish\n```');
  });

  const mermaidSelector = '.ProseMirror .cherry-embed--cherry_diagram[data-type="mermaid"]';
  await expect.poll(() => page.locator(mermaidSelector).count()).toBe(1);
  const mermaid = page.locator(mermaidSelector).first();
  await expect(mermaid).toBeVisible();
  await expect(mermaid.locator('svg')).toHaveCount(1);
  await mermaid.click();
  await expect(mermaid).toHaveClass(/is-selected/);
  await expect(page.locator('.cherry-previewer-img-size-handler__points')).toHaveCount(8);
  await expect(page.locator('.cherry-previewer-img-tool-handler .img-tool-button')).toHaveCount(5);
  actions.push('selected Mermaid and exposed Cherry native resize and alignment controls');

  const corner = page.locator('.cherry-previewer-img-size-handler__points-rightBottom');
  const box = await corner.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 30, box!.y + box!.height / 2 + 30, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => /```mermaid #\d+px #\d+px/.test((await readState(page)).cherry)).toBe(true);
  actions.push('resized Mermaid and wrote its dimensions back to Markdown');

  await mermaid.click();
  await page.locator('.cherry-previewer-img-tool-handler [title="居中"]').click();
  await expect(mermaid).toHaveClass(/cherry-mermaid-align-center/);
  await expect
    .poll(async () => {
      const state = await readState(page);
      return {
        synchronized: state.cherry === state.codeMirror && state.cherry === state.milkdown,
        syntax: /```mermaid #\d+px #\d+px #center/.test(state.cherry),
      };
    })
    .toEqual({ synchronized: true, syntax: true });
  actions.push('centered Mermaid and synchronized Cherry, CodeMirror, and Milkdown');

  await mermaid.click();
  await mermaid.getByRole('button', { name: '在节点内编辑源码' }).click();
  await expect(mermaid.locator('.cherry-embed__source')).toBeVisible();
  await expect(page.locator('.cherry-previewer-img-size-handler')).toHaveCount(0);
  await expect(page.locator('.cherry-previewer-img-tool-handler')).toHaveCount(0);
  actions.push('opened in-node Mermaid source without overlapping native floating controls');

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

test('focused inline edits preserve Cherry layout, dimensions and scroll position', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('# Stable heading\n\nStable `seed` text.\n\n## Anchor\n\nAfter.');
  });

  const preview = page.locator('.cherry-previewer').first();
  const inlineCode = page.locator('.ProseMirror code').filter({ hasText: /^seed$/ }).first();
  const anchor = page.locator('.ProseMirror h2', { hasText: 'Anchor' }).first();
  await anchor.scrollIntoViewIfNeeded();
  const before = await Promise.all([preview.boundingBox(), anchor.boundingBox()]);
  expect(before[0]).not.toBeNull();
  expect(before[1]).not.toBeNull();
  const scrollTop = await preview.evaluate((element) => element.scrollTop);
  await inlineCode.click();
  await page.keyboard.press('ArrowLeft');

  for (const character of 'abcde') {
    await page.keyboard.insertText(character);
    await page.waitForTimeout(5);
    const after = await Promise.all([preview.boundingBox(), anchor.boundingBox()]);
    expect(after[0]).not.toBeNull();
    expect(after[1]).not.toBeNull();
    expect(Math.abs(after[1]!.y - before[1]!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(after[0]!.height - before[0]!.height)).toBeLessThanOrEqual(1);
    await expect.poll(() => preview.evaluate((element) => element.scrollTop)).toBe(scrollTop);
  }
  actions.push('typed five focused inline-code characters without layout or scroll jumps');

  const overflow = await page.evaluate(() => {
    const container = document.querySelector('.cherry-previewer');
    if (!container) return null;
    return { scrollWidth: container.scrollWidth, clientWidth: container.clientWidth };
  });
  expect(overflow).not.toBeNull();
  expect(overflow!.scrollWidth).toBeLessThanOrEqual(overflow!.clientWidth + 1);
  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('Cherry toolbar operates on the focused Milkdown surface', async ({ page }, testInfo) => {
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

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('every Cherry size submenu item formats the focused Milkdown selection', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));

  for (const [label, size] of [
    ['小', '12'],
    ['中', '17'],
    ['大', '24'],
    ['特大', '32'],
  ] as const) {
    await page.evaluate(() => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue('Format me now');
    });
    const paragraph = page.locator('.ProseMirror p', { hasText: 'Format me now' });
    await paragraph.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.locator('.toolbar-left [title="大小"]').click();
    await page.locator(`.cherry-dropdown [title="${label}"]`).click();
    await expect(page.locator(`.ProseMirror .cherry-wysiwyg-size[data-cherry-size="${size}"]`)).toHaveText('Format me now');
    await expect
      .poll(async () => {
        const state = await readState(page);
        return { markdown: state.cherry, synchronized: state.cherry === state.codeMirror && state.cherry === state.milkdown };
      })
      .toEqual({ markdown: `!${size} Format me now!`, synchronized: true });
    actions.push(`applied size ${label} (${size}px) to a real preview selection`);
  }

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('every Cherry strike submenu item operates on the focused Milkdown selection', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));

  const cases = [
    ['删除线', '~~Format me now~~'],
    ['下划线', '/Format me now/'],
    ['下标', '^^Format me now^^'],
    ['上标', '^Format me now^'],
    ['拼音', '{ Format me now | Format me now }'],
    ['加粗斜体', '***Format me now***'],
  ] as const;
  for (const [label, expected] of cases) {
    await page.evaluate(() => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue('Format me now');
    });
    await page.locator('.ProseMirror p', { hasText: 'Format me now' }).click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.locator('.toolbar-left [title="删除线"]').click();
    await page.locator(`.cherry-dropdown [title="${label}"]`).click();
    await expect.poll(async () => (await readState(page)).cherry).toContain(expected);
    await expect.poll(async () => {
      const state = await readState(page);
      return state.cherry === state.codeMirror && state.cherry === state.milkdown;
    }).toBe(true);
    actions.push(`applied strike submenu item ${label} to the complete preview selection`);
  }

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('all toolbar heading levels H1 through H5 can be created and edited in preview', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  for (const level of [1, 2, 3, 4, 5] as const) {
    await page.evaluate(() => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue('Heading item');
    });
    await page.locator('.ProseMirror p', { hasText: 'Heading item' }).click();
    await page.locator('.toolbar-left [title="标题"]').click();
    await page.locator(`.cherry-dropdown [title="${['', '一级标题', '二级标题', '三级标题', '四级标题', '五级标题'][level]}"]`).click();
    await expect(page.locator(`.ProseMirror h${level}`)).toHaveText('Heading item');
    await expect.poll(async () => (await readState(page)).cherry.trim()).toBe(`${'#'.repeat(level)} Heading item`);
    actions.push(`created H${level} from a preview paragraph and kept its Markdown synchronized`);
  }
  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('all Cherry panel types can be created from the preview caret', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  for (const type of ['tips', 'info', 'warning', 'danger', 'success'] as const) {
    const renderedType = type === 'tips' ? 'primary' : type;
    await page.evaluate(() => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue('Panel text');
    });
    await page.locator('.ProseMirror p', { hasText: 'Panel text' }).click();
    await page.locator('.toolbar-left [title="面板"]').click();
    await page.locator(`.cherry-dropdown [title="${type}"]`).click();
    await expect(page.locator(`.ProseMirror .cherry-panel__${renderedType}`)).toBeVisible();
    await expect.poll(async () => (await readState(page)).cherry).toContain(`::: ${renderedType}`);
    actions.push(`created ${type} Panel from the preview caret`);
  }
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

test('physical clicks edit code and navigate links and TOC inside the preview', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  const filler = Array.from({ length: 80 }, (_, index) => `Paragraph ${index}.`).join('\n\n');
  await page.evaluate((markdown) => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue(markdown);
  }, `# Target\n\n${filler}\n\n[Jump to target](#target)\n\n\`\`\`js\nconst value = 1;\n\`\`\`\n\n[[toc]]`);

  const editor = page.locator('.ProseMirror');
  const code = editor.locator('.cherry-milkdown-code-block code');
  await page.locator('.cherry-editor .cm-content').click();
  await expect(page.locator('.cherry-editor .cm-content')).toBeFocused();
  await code.click({ position: { x: 90, y: 10 } });
  await expect(editor).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('const clicked = true;');
  await expect.poll(async () => (await readState(page)).cherry).toContain('const clicked = true;');
  await page.waitForTimeout(500);
  actions.push('focused and edited a fenced code block through a physical click');

  const preview = page.locator('.cherry-previewer').first();
  const targetHeading = editor.locator('h1#target');
  const link = editor.getByRole('link', { name: 'Jump to target' });
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(editor).toBeFocused();
  await expect(link).not.toHaveAttribute('title');
  const popupPromise = page.waitForEvent('popup');
  await link.click({ modifiers: ['ControlOrMeta'] });
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/#target$/);
  await popup.close();
  actions.push('kept a normal link editable and followed it with Ctrl/Cmd click');

  const tocLink = editor.locator('.cherry-source-node--cherry_toc a', { hasText: 'Target' });
  await tocLink.scrollIntoViewIfNeeded();
  await tocLink.click();
  await expect.poll(async () => {
    const [headingBox, previewBox] = await Promise.all([targetHeading.boundingBox(), preview.boundingBox()]);
    return headingBox && previewBox ? Math.abs(headingBox.y - previewBox.y) : Number.POSITIVE_INFINITY;
  }).toBeLessThan(32);
  await expect(page).toHaveURL(/#target$/);
  actions.push('navigated to a generated heading through the native-looking TOC');

  const state = await readState(page);
  expect(state.cherry).toBe(state.codeMirror);
  expect(state.cherry).toBe(state.milkdown);
  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('Markdown shortcuts create H6 and code blocks without a right-side suggest popup', async ({ page }, testInfo) => {
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
  await expect.poll(() => page.locator('.ProseMirror > *').count()).toBe(1);
  await page.locator('.ProseMirror p').first().click();
  await page.keyboard.insertText('/');
  await expect(page.locator('.cherry-milkdown-slash')).toHaveCount(0);
  await page.keyboard.press('Backspace');
  actions.push('typed a slash in a plain preview paragraph without opening a suggest popup');

  await setMarkdown('');
  await expect.poll(() => page.locator('.ProseMirror > *').count()).toBe(1);
  await page.locator('.ProseMirror p').click();
  await page.keyboard.insertText('###### ');
  await page.keyboard.insertText('Sixth level');
  await expect(page.locator('.ProseMirror h6')).toHaveText('Sixth level');
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('###### Sixth level');
  actions.push('created and edited H6 through the Markdown shortcut without a suggest popup');

  await setMarkdown('');
  await expect.poll(() => page.locator('.ProseMirror > *').count()).toBe(1);
  await page.locator('.ProseMirror p').click();
  await page.keyboard.insertText('```');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('slashCode();');
  await expect(page.locator('.ProseMirror .cherry-milkdown-code-block code')).toHaveText('slashCode();');
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('```\nslashCode();\n```');
  await expect(page.locator('.cherry-editor .cm-content')).not.toBeFocused();
  await page.keyboard.insertText('/');
  await expect(page.locator('.cherry-milkdown-slash')).toHaveCount(0);
  actions.push('created a directly editable fenced code block and kept the right preview free of suggest popups');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('Cherry previewOnly becomes a toolbar-free WYSIWYG surface without a second mode config', async ({
  page,
}, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(previewOnlyPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));

  await expect(page.locator('.ProseMirror')).toBeVisible();
  await expect(page.locator('.cherry-editor')).toBeHidden();
  await expect(page.locator('.cherry-toolbar')).toBeHidden();
  await expect(page.locator('.cherry-toolbar-right')).toBeHidden();
  await expect(page.locator('.cherry-sidebar')).toBeHidden();
  actions.push('opened Cherry native previewOnly with no global editing toolbar');

  const setMarkdown = (value: string) =>
    page.evaluate((next) => {
      const scope = window as typeof window & { cherry: { setValue(markdown: string): void } };
      scope.cherry.setValue(next);
    }, value);

  await setMarkdown('# Direct heading\n\nBody');
  await expect(page.locator('.ProseMirror h1')).toHaveCount(1);
  await expect(page.locator('.ProseMirror h1')).toHaveText('Direct heading');
  await page.locator('.ProseMirror h1').click();
  await page.keyboard.press('ControlOrMeta+Alt+2');
  await expect(page.locator('.ProseMirror h2')).toHaveText('Direct heading');
  await expect.poll(async () => (await readState(page)).cherry.startsWith('## Direct heading')).toBe(true);
  actions.push('changed an existing heading to H2 with the toolbar-free heading shortcut');

  await setMarkdown('');
  await expect.poll(() => page.locator('.ProseMirror > *').count()).toBe(1);
  await page.locator('.ProseMirror p').click();
  await page.keyboard.insertText('```');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('previewOnly();');
  await expect(page.locator('.ProseMirror .cherry-milkdown-code-block code')).toHaveText('previewOnly();');
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('```\npreviewOnly();\n```');
  await expect(page.locator('.cherry-suggester-panel:visible')).toHaveCount(0);
  actions.push('created and edited a fenced code block without a source suggest panel');

  const state = await readState(page);
  expect(state.cherry).toBe(state.codeMirror);
  expect(state.cherry).toBe(state.milkdown);
  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('physical delete, clipboard, undo/redo and composition input stay synchronized', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  const setValue = (value: string) =>
    page.evaluate((markdown) => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue(markdown);
    }, value);
  const markdown = () => page.evaluate(() => (window as typeof window & { cherry: { getMarkdown(): string } }).cherry.getMarkdown());

  await setValue('Delete me');
  const paragraph = page.locator('.ProseMirror p').first();
  await paragraph.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Shift+Home');
  await page.keyboard.press('Backspace');
  await expect.poll(async () => (await markdown()).trim()).toBe('');
  actions.push('deleted a selected paragraph with Backspace');

  await page.keyboard.insertText('Copy me');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+C');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('ControlOrMeta+V');
  await expect.poll(async () => (await markdown()).trim()).toBe('Copy me');
  actions.push('copied, deleted and pasted text through the browser clipboard');

  await page.keyboard.press('End');
  await page.keyboard.insertText(' one');
  await page.waitForTimeout(800);
  await page.keyboard.insertText(' two');
  await expect.poll(async () => (await markdown()).trim()).toBe('Copy me one two');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(async () => (await markdown()).trim()).toBe('Copy me one');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect.poll(async () => (await markdown()).trim()).toBe('Copy me one two');
  actions.push('undid and redid two user input groups without reverting the document');

  await setValue('汉');
  const compositionTarget = page.locator('.ProseMirror p').first();
  await compositionTarget.evaluate((element) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    element.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: '汉字' }));
    element.textContent = '汉字';
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '汉字' }));
  });
  await expect.poll(async () => (await markdown()).trim()).toBe('汉字');
  actions.push('completed a composition-style Chinese input and kept Markdown synchronized');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('ordered-list toolbar keeps Cherry default nested-list behavior', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  await page.evaluate(() => {
    const scope = window as typeof window & { cherry: { setValue(value: string): void } };
    scope.cherry.setValue('');
  });

  const paragraph = page.locator('.ProseMirror p').first();
  await paragraph.click();
  await page.locator('.toolbar-left [title="有序列表"]').click();
  await expect(page.locator('.ProseMirror > ol > li')).toHaveCount(2);
  await expect(page.locator('.ProseMirror > ol > li:first-child > ol > li')).toHaveCount(1);
  await expect
    .poll(async () => {
      const state = await readState(page);
      const normalized = state.cherry.trim().replace(/\n +(?=\d+\.)/g, '\n    ');
      return { normalized, synchronized: state.cherry === state.codeMirror && state.cherry === state.milkdown };
    })
    .toEqual({
      normalized: '1. Item 1\n    1. Item 1.1\n2. Item 2',
      synchronized: true,
    });
  actions.push('used the ordered-list toolbar on an empty paragraph and preserved Cherry nested-list defaults');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('unordered, task-list, table and rule creation stay in the preview editor', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  const setValue = (value: string) =>
    page.evaluate((markdown) => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue(markdown);
    }, value);

  await setValue('Bullet item');
  await page.locator('.ProseMirror p', { hasText: 'Bullet item' }).click();
  await page.locator('.toolbar-left [title="无序列表"]').click();
  await expect(page.locator('.ProseMirror > ul > li')).toHaveCount(1);
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('- Bullet item');
  actions.push('created an unordered list from the preview caret');

  await setValue('Task item');
  await page.locator('.ProseMirror p', { hasText: 'Task item' }).click();
  await page.locator('.toolbar-left [title="清单"]').click();
  await expect(page.locator('.ProseMirror li[data-item-type="task"]')).toHaveCount(1);
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('- [x] Task item');
  actions.push('created and rendered a task list from the preview caret');

  await setValue('Rule');
  await page.locator('.ProseMirror p', { hasText: 'Rule' }).click();
  await page.locator('.toolbar-left [title="插入"]').click();
  await page.locator('.cherry-dropdown[name="insert"] [title="分隔线"]').click();
  await expect(page.locator('.ProseMirror hr')).toHaveCount(1);
  await expect.poll(async () => (await readState(page)).cherry).toContain('---');
  actions.push('created a horizontal rule from the Insert submenu');

  await setValue('Table');
  await page.locator('.ProseMirror p', { hasText: 'Table' }).click();
  await page.locator('.toolbar-left [title="插入"]').click();
  await page.locator('.cherry-dropdown[name="insert"] [title="表格"]').click();
  await expect(page.locator('.ProseMirror .milkdown-table-block table.children')).toBeVisible();
  await expect.poll(async () => (await readState(page)).cherry).toContain('|');
  actions.push('created a GFM table from the Insert submenu');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('focusing any Cherry link does not move it or rewrite ProseMirror DOM', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  const markdown = [
    '# Target',
    '',
    '**效果**',
    '[普通链接](https://example.com/plain)',
    '[!!#ff0000 红色超链接!!](https://example.com/red)',
    '[!!#ffffff !!!#000000 黑底白字超链接!!!!!](https://example.com/background)',
    '[新窗口打开](https://example.com){target=_blank}',
    '<https://example.com/auto>',
    '[锚点链接](#target)',
  ].join('\n');
  await page.evaluate((value) => {
    const scope = window as typeof window & { cherry: { setValue(markdown: string): void } };
    scope.cherry.setValue(value);
  }, markdown);

  await expect(page.locator('.ProseMirror')).toContainText('锚点链接');
  await expect.poll(async () => (await readState(page)).cherry).toContain('新窗口打开');
  const closeToc = page.locator('.cherry-flex-toc__full .ch-icon-chevronsRight');
  if (await closeToc.isVisible()) await closeToc.click();
  const linkNames = [
    '普通链接',
    '红色超链接',
    '黑底白字超链接',
    '新窗口打开',
    'https://example.com/auto',
    '锚点链接',
  ];
  for (const name of linkNames) {
    const link = page.getByRole('link', { name, exact: true });
    await link.scrollIntoViewIfNeeded();
    const beforeBox = await link.boundingBox();
    const beforeHtml = await link.evaluate((element) => element.parentElement?.innerHTML);
    await link.click();
    const afterBox = await link.boundingBox();
    const afterHtml = await link.evaluate((element) => element.parentElement?.innerHTML);

    expect(beforeBox, name).not.toBeNull();
    expect(afterBox, name).not.toBeNull();
    expect(Math.abs((afterBox?.x ?? 0) - (beforeBox?.x ?? 0)), name).toBeLessThan(0.5);
    expect(Math.abs((afterBox?.y ?? 0) - (beforeBox?.y ?? 0)), name).toBeLessThan(0.5);
    expect(afterHtml, name).toBe(beforeHtml);
    await expect(link, name).not.toHaveAttribute('target');
    await expect(link, name).not.toHaveAttribute('title');
  }
  await expect
    .poll(async () => {
      const state = await readState(page);
      return { containsLink: state.cherry.includes('新窗口打开'), synchronized: state.cherry === state.codeMirror };
    })
    .toEqual({ containsLink: true, synchronized: true });
  actions.push('focused plain, styled, target, automatic and anchor links without moving or mutating DOM');

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
    { id: 'task-list', native: '#native .check-list-item', milkdown: '#milkdown .ProseMirror li[data-item-type="task"]' },
    { id: 'blockquote', native: '#native blockquote', milkdown: '#milkdown blockquote' },
    { id: 'table', native: '#native table', milkdown: '#milkdown .milkdown-table-block table.children' },
    {
      id: 'table-chart',
      native: '#native .cherry-table-wrapper:has(.cherry-echarts-wrapper)',
      milkdown: '#milkdown .cherry-table-chart',
    },
    { id: 'panel', native: '#native .cherry-panel', milkdown: '#milkdown .cherry-panel' },
    { id: 'detail', native: '#native details', milkdown: '#milkdown .cherry-detail' },
    {
      id: 'code-block',
      native: '#native [data-type="codeBlock"]',
      milkdown: '#milkdown .cherry-milkdown-code-block',
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
  }
  // Rendering the lazy chart can settle layout while the component screenshots
  // scroll through the page. Take one stable document-coordinate snapshot
  // after all renderers have been activated instead of mixing scroll states
  // from different screenshots.
  await page.waitForTimeout(100);
  layout.push(
    ...(await page.evaluate((items) => {
      const read = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
      };
      return items.map((item) => ({ id: item.id, native: read(item.native), milkdown: read(item.milkdown) }));
    }, components)),
  );
  if (layout.some((item) => !item.native || !item.milkdown)) throw new Error('Missing visual layout selector');
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
    return [
      ['h1', '#native .cherry-previewer h1', '#milkdown .ProseMirror h1'],
      ['p', '#native .cherry-previewer > p', '#milkdown .ProseMirror > p'],
      ['blockquote', '#native blockquote', '#milkdown blockquote'],
      ['table', '#native table', '#milkdown .milkdown-table-block table.children'],
      [
        'pre',
        '#native [data-type="codeBlock"] > .custom-codeblock-wrapper > pre',
        '#milkdown .cherry-milkdown-code-block > pre',
      ],
      ['task-icon', '#native .check-list-item .ch-icon', '#milkdown .ProseMirror li[data-item-type="task"] .ch-icon'],
    ].map(([selector, nativeSelector, milkdownSelector]) => {
      const native = document.querySelector(nativeSelector);
      const milkdown = document.querySelector(milkdownSelector);
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
    } else if (capability.expectedText) {
      await expect(page.locator('.ProseMirror'), capability.id).toContainText(capability.expectedText);
    } else {
      throw new Error(`Compatibility case ${capability.id} has no selector or expectedText assertion.`);
    }
    const markdown = (await readState(page)).cherry;
    expect(markdown.length, capability.id).toBeGreaterThan(0);
    actions.push(`rendered ${capability.id} as ${capability.mode}`);
  }

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('manual interaction matrix covers focus, edit, create and delete for remaining nodes', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  const setValue = (value: string) =>
    page.evaluate((markdown) => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue(markdown);
    }, value);
  const sync = async (expected: string) => {
    await expect
      .poll(async () => {
        const state = await readState(page);
        return { markdown: state.cherry, synchronized: state.cherry === state.codeMirror && state.cherry === state.milkdown };
      })
      .toEqual({ markdown: expected, synchronized: true });
  };

  // Inline marks: real text selection, toolbar command, and source round-trip.
  await setValue('Bold text');
  const paragraph = page.locator('.ProseMirror p').first();
  await paragraph.click({ position: { x: 8, y: 10 } });
  for (let index = 0; index <= 'Bold text'.length; index += 1) await page.keyboard.press('ArrowLeft');
  for (let index = 0; index < 'Bold'.length; index += 1) await page.keyboard.press('Shift+ArrowRight');
  await page.locator('.toolbar-left [title="加粗"]').click();
  await sync('**Bold** text');
  actions.push('selected paragraph text and applied bold through Cherry toolbar');

  // Custom Cherry menus must keep their legacy editor API when the preview
  // owns the selection. This is a real submenu click, not a direct bridge
  // invocation.
  await setValue('Custom menu text');
  const customParagraph = page.locator('.ProseMirror p').first();
  await customParagraph.click({ position: { x: 8, y: 10 } });
  for (let index = 0; index <= 'Custom'.length + 5; index += 1) await page.keyboard.press('ArrowLeft');
  for (let index = 0; index < 'Custom'.length; index += 1) await page.keyboard.press('Shift+ArrowRight');
  await page.locator('.toolbar-left [title="自定义菜单+自定义菜单图标"]').click();
  await page.locator('.cherry-dropdown:visible').last().locator('[title="加粗斜体"]').click();
  await sync('***Custom*** menu text');
  actions.push('ran the custom Cherry bold-italic submenu on a preview selection');

  await setValue('Custom submenu');
  const customSubmenuParagraph = page.locator('.ProseMirror p').first();
  await customSubmenuParagraph.click({ position: { x: 8, y: 10 } });
  await page.keyboard.press('End');
  await page.keyboard.press('Shift+Home');
  await page.locator('.toolbar-left [title="自定义菜单+子菜单"]').click();
  await page.locator('.cherry-dropdown:visible').last().locator('[title="快捷键"]').click();
  await sync('Custom submenu快捷键看这里：<https://codemirror.net/docs/ref/#commands>\n');
  actions.push('ran a custom multi-level submenu on a preview selection');

  // GFM table: focus a cell, edit it, then use the native row/column controls.
  await setValue('| A | B |\n| --- | ---: |\n| 1 | 2 |');
  const table = page.locator('.ProseMirror .milkdown-table-block').first();
  const tableCell = table.locator('table.children tbody td p').first();
  await tableCell.click();
  await page.keyboard.press('End');
  await page.keyboard.insertText('x');
  await expect.poll(async () => (await readState(page)).cherry).toContain('1x');
  await tableCell.hover();
  const tableRows = table.locator('table.children tbody tr');
  const rowsBefore = await tableRows.count();
  const tableBox = await table.locator('table.children').boundingBox();
  expect(tableBox).not.toBeNull();
  // Milkdown resolves the cell under the pointer before checking its edge, so
  // hover a few pixels inside the right border rather than outside the table.
  await page.mouse.move(tableBox!.x + tableBox!.width - 2, tableBox!.y + tableBox!.height / 2);
  const rowLine = table.locator('[data-role="x-line-drag-handle"]');
  await expect(rowLine).toHaveAttribute('data-show', 'true');
  await rowLine.locator('.add-button').click();
  await expect.poll(() => tableRows.count()).toBe(rowsBefore + 1);
  await table.locator('[data-role="row-drag-handle"]').hover();
  const rowDelete = table.locator('[data-role="row-drag-handle"] .button-group button').first();
  await expect(rowDelete).toBeVisible();
  await rowDelete.click();
  await expect.poll(() => tableRows.count()).toBe(rowsBefore);
  const colsBefore = await table.locator('table.children tbody tr').first().locator(':scope > *').count();
  await page.mouse.move(tableBox!.x + tableBox!.width / 2, tableBox!.y + tableBox!.height - 2);
  const colLine = table.locator('[data-role="y-line-drag-handle"]');
  await expect(colLine).toHaveAttribute('data-show', 'true');
  await colLine.locator('.add-button').click();
  await expect.poll(() => table.locator('table.children tbody tr').first().locator(':scope > *').count()).toBe(colsBefore + 1);
  await table.locator('[data-role="col-drag-handle"]').hover();
  const colDelete = table.locator('[data-role="col-drag-handle"] .button-group button').last();
  await expect(colDelete).toBeVisible();
  await colDelete.click();
  await expect.poll(() => table.locator('table.children tbody tr').first().locator(':scope > *').count()).toBe(colsBefore);
  await expect.poll(async () => (await readState(page)).cherry).toContain('1x');
  actions.push('edited a table cell and created a row and column with preview controls');

  // GFM task items expose a Cherry-style leading checkbox. Clicking the
  // control toggles only the list item's checked attribute; text remains
  // editable and the Markdown owners update immediately.
  await setValue('- [ ] todo');
  const taskItem = page.locator('.ProseMirror li[data-item-type="task"]').first();
  await expect(taskItem).toBeVisible();
  const taskIcon = taskItem.locator('.ch-icon').first();
  await expect(taskIcon).toHaveClass(/ch-icon-square/);
  await expect(taskItem).toHaveClass(/cherry-list-item/);
  await expect(taskItem).toHaveClass(/check-list-item/);
  await expect
    .poll(async () => taskIcon.evaluate((element) => ({
      font: getComputedStyle(element).fontFamily,
      margin: getComputedStyle(element).margin,
      display: getComputedStyle(element).display,
    })))
    .toEqual(expect.objectContaining({ margin: '0px 6px 0px -20px', display: 'inline' }));
  const clickTaskCheckbox = async () => {
    await taskItem.scrollIntoViewIfNeeded();
    const taskBox = await taskItem.boundingBox();
    if (!taskBox) throw new Error('Missing task-list item box');
    // Use a physical pointer event in the checkbox hit area. This mirrors a
    // user's click on Cherry's leading checkbox and avoids relying on a
    // selector-relative synthetic click point after the node re-renders.
    await page.mouse.click(taskBox.x + 8, taskBox.y + taskBox.height / 2);
  };
  await clickTaskCheckbox();
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('- [x] todo');
  await clickTaskCheckbox();
  await expect.poll(async () => (await readState(page)).cherry.trim()).toBe('- [ ] todo');
  actions.push('toggled a task-list checkbox twice without leaving the preview editor');

  // Formula: click the MathLive field, type, and verify immediate Markdown sync.
  await setValue('$x$');
  const math = page.locator('.ProseMirror math-field').first();
  await math.click();
  await page.keyboard.press('End');
  await math.pressSequentially('^2');
  await expect.poll(async () => (await readState(page)).cherry).toContain('$x^2$');
  actions.push('focused and edited an inline MathLive formula');

  await setValue('Formula menu');
  await page.locator('.ProseMirror p').first().click();
  await page.locator('.toolbar-left [title="公式"]').click();
  const formulaItem = page.locator('.cherry-formula-item:visible').first();
  await expect(formulaItem).toBeVisible();
  await formulaItem.click();
  await expect.poll(async () => (await readState(page)).cherry).toContain('$\\times$');
  actions.push('opened the Cherry formula palette and inserted a symbol into Milkdown');

  // Panel and Timeline: titles are native inputs; add/delete controls operate in place.
  await setValue(':::warning Notice\nBody\n:::');
  const panel = page.locator('.ProseMirror .cherry-panel').first();
  const panelTitle = panel.locator('.cherry-compound__title');
  await panelTitle.fill('Updated Notice');
  await expect.poll(async () => (await readState(page)).cherry).toContain(':::warning Updated Notice');
  actions.push('edited a Panel title in place');

  await setValue(':::timeline\n:: 2025\nFirst\n:: 2026\nSecond\n:::');
  const timeline = page.locator('.ProseMirror .cherry-compound--timeline').first();
  const timelineLabel = timeline.locator('.cherry-compound-item__label').first();
  await timelineLabel.fill('2024');
  await expect.poll(async () => (await readState(page)).cherry).toContain(':: 2024');
  await timeline.getByRole('button', { name: '增加项目' }).click();
  await expect.poll(() => timeline.locator('.cherry-compound-item').count()).toBe(3);
  await timeline.locator('.cherry-compound-item').last().getByRole('button', { name: '删除项目' }).click();
  await expect.poll(() => timeline.locator('.cherry-compound-item').count()).toBe(2);
  actions.push('edited, added and deleted a Timeline item in place');

  // Creating a timeline from a plain paragraph includes Cherry's empty
  // placeholder items. They must be legal empty paragraphs, never empty text
  // nodes rejected by ProseMirror.
  await setValue('Alpha beta');
  await page.locator('.ProseMirror p').first().click();
  await page.locator('.toolbar-left [title="时间线"]').click();
  await expect(page.locator('.ProseMirror .cherry-compound--timeline .cherry-compound-item')).toHaveCount(5);
  actions.push('created a Timeline from plain text without empty-node errors');

  // Restricted HTML: source editing remains in-node and dangerous markup never enters the DOM.
  await setValue('<div>HTML</div>');
  const html = page.locator('.ProseMirror .cherry-embed').first();
  await html.click();
  await html.getByRole('button', { name: '在节点内编辑源码' }).click();
  const htmlSource = html.locator('.cherry-embed__source code');
  await htmlSource.fill('<script>alert(1)</script><p>Safe</p>');
  await expect.poll(async () => (await readState(page)).cherry).toContain('Safe');
  await expect(html.locator('script')).toHaveCount(0);
  actions.push('edited HTML source in place and verified script sanitization');

  expect(errors).toEqual([]);
  await attachEvidence(page, testInfo, actions, errors);
});

test('compound nodes expose in-place creation, editing, deletion and disclosure controls', async ({ page }, testInfo) => {
  const actions: string[] = [];
  const errors = captureBrowserErrors(page, actions);
  await page.goto(demoPath);
  await page.waitForFunction(() => Boolean((window as typeof window & { cherry?: unknown }).cherry));
  const setValue = (value: string) =>
    page.evaluate((markdown) => {
      const scope = window as typeof window & { cherry: { setValue(value: string): void } };
      scope.cherry.setValue(markdown);
    }, value);

  await setValue(':::tabs\n:: One\nFirst\n:: Two\nSecond\n:::');
  const tabs = page.locator('.ProseMirror .cherry-compound--tabs');
  await expect(tabs).toBeVisible();
  await expect.poll(() => tabs.locator('.cherry-compound-item').count()).toBe(2);
  const tabLabel = tabs.locator('.cherry-compound-item__label').first();
  await tabLabel.click();
  await tabLabel.press('ControlOrMeta+A');
  await page.keyboard.insertText('Renamed');
  await expect.poll(async () => (await readState(page)).cherry).toContain(':: Renamed');
  await tabs.getByRole('button', { name: '增加项目' }).click();
  await expect.poll(() => tabs.locator('.cherry-compound-item').count()).toBe(3);
  await tabs.locator('.cherry-compound-item').last().getByRole('button', { name: '删除项目' }).click();
  await expect.poll(() => tabs.locator('.cherry-compound-item').count()).toBe(2);
  actions.push('edited, added and deleted a tab item in place');

  await setValue('+++ More\nBody\n+++');
  const detail = page.locator('.ProseMirror .cherry-detail');
  const item = detail.locator('[data-role="detail-item"]').first();
  await expect(item).toBeVisible();
  const disclosure = item.getByRole('button', { name: '切换默认展开状态' });
  await disclosure.click();
  await expect(item).toHaveAttribute('data-open', 'true');
  const detailLabel = item.locator('.cherry-compound-item__label');
  await detailLabel.click();
  await detailLabel.press('ControlOrMeta+A');
  await page.keyboard.insertText('More details');
  await expect.poll(async () => (await readState(page)).cherry).toContain('+++- More details');
  expect(errors).toEqual([]);
  actions.push('toggled Detail independently from its editable title');
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
