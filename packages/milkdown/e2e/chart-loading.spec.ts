import { test, expect, markdown, setMarkdown } from './fixtures';
import { test as errorTest } from '@playwright/test';

test('a custom Engine cleanup failure does not interrupt sibling renderer cleanup', async ({ page }) => {
  await page.goto('/upload-harness.html?engine-cleanup-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await expect(page.locator('.cherry-embed--cherry_diagram .cherry-embed__preview')).toHaveText(['First', 'Second']);
  const result = await page.evaluate(async () => {
    const result = await Promise.allSettled([window.uploadEditor!.destroy(), window.uploadEditor!.destroy()]);
    const state = window as Window & { engineRendererCleanups?: number; engineCleanupErrors?: string[] };
    return {
      statuses: result.map((entry) => entry.status),
      cleanups: state.engineRendererCleanups,
      errors: state.engineCleanupErrors,
    };
  });
  expect(result.statuses).toEqual(['fulfilled', 'fulfilled']);
  expect(result.cleanups).toBe(2);
  expect(result.errors).toEqual(['render: Error: Engine cleanup failed', 'render: Error: Engine cleanup failed']);
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
});

test('nested renderer destruction does not start sibling charts', async ({ page }) => {
  await page.goto('/upload-harness.html?nested-destroy');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const chart = (title: string) =>
    [`| :line:{"title":"${title}"} | Jan |`, '| --- | --- |', '| Sales | 1 |'].join('\n');
  await page.evaluate(
    (value) => window.uploadEditor!.setMarkdown(value),
    ['::: 2cols', chart('First'), '::', chart('Second'), ':::'].join('\n'),
  );
  await page.waitForFunction(() => (window as Window & { nestedDestroyed?: boolean }).nestedDestroyed);
  const state = await page.evaluate(() => {
    const result = window as Window & { nestedCalls?: Array<{ source: string }>; nestedCleanups?: number };
    return { calls: result.nestedCalls, cleanups: result.nestedCleanups };
  });
  expect(state.calls).toHaveLength(1);
  expect(state.calls?.[0]?.source).toContain('First');
  expect(state.cleanups).toBe(1);
  await expect(page.locator('.ProseMirror')).toHaveCount(0);
  await expect(page.locator('[data-render-pending]')).toHaveCount(0);
});

test('nested renderer replacement does not start obsolete sibling charts', async ({ page }) => {
  await page.goto('/upload-harness.html?nested-reentrant');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const chart = (title: string) =>
    [`| :line:{"title":"${title}"} | Jan |`, '| --- | --- |', '| Sales | 1 |'].join('\n');
  await page.evaluate(
    (value) => window.uploadEditor!.setMarkdown(value),
    ['::: 2cols', chart('First'), '::', chart('Second'), ':::'].join('\n'),
  );
  await expect.poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown())).toBe('Replacement');
  await expect(page.locator('.ProseMirror')).toHaveText('Replacement');
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const calls = await page.evaluate(
    () => (window as Window & { nestedCalls?: Array<{ source: string; aborted: boolean }> }).nestedCalls,
  );
  expect(calls).toHaveLength(1);
  expect(calls?.[0]).toEqual({ source: expect.stringContaining('First'), aborted: false });
});

test('a renderer cleanup that updates the document cannot leave an obsolete preview', async ({ page }) => {
  await page.goto('/upload-harness.html?render-reentrant');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const preview = page.locator('.cherry-embed--cherry_diagram .cherry-embed__preview');
  await expect(preview).toHaveText('Old');
  await page.evaluate(() => {
    (window as Window & { reenterRender?: boolean }).reenterRender = true;
    window.uploadEditor!.setMarkdown('```custom-preview\nMiddle\n```', { emit: false });
  });
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toBe('```custom-preview\nLatest\n```');
  await expect(preview).toHaveText('Latest');
});

test('a failed renderer cannot report an obsolete error after abort starts a newer render', async ({ page }) => {
  await page.goto('/upload-harness.html?failure-reentrant');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const preview = page.locator('.cherry-embed--cherry_diagram .cherry-embed__preview');
  await expect(preview).toHaveText('Old');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('```custom-preview\nMiddle\n```', { emit: false }));
  await expect
    .poll(() => page.evaluate(() => window.uploadEditor!.getMarkdown()))
    .toBe('```custom-preview\nLatest\n```');
  await expect(preview).toHaveText('Latest');
  expect(
    await page.evaluate(() => (window as Window & { failureReentrantErrors?: string[] }).failureReentrantErrors ?? []),
  ).toEqual([]);
  await expect(preview).not.toHaveAttribute('data-render-error');
});

test('invalid ECharts source labels the previous preview until corrected', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(page, '```echarts\n{"title":{"text":"Previous"},"series":[]}\n```');
  const node = page.locator('.cherry-embed--cherry_diagram:not([data-type="mermaid"])');
  await expect(node.locator('svg')).toContainText('Previous');
  await node.getByRole('button', { name: '在节点内编辑源码', exact: true }).click();
  const source = node.locator('.cherry-embed__source code');
  await source.fill('{ invalid');
  await expect(node.getByRole('alert')).toContainText('上一次成功渲染');
  await expect(node.getByRole('alert')).toHaveCSS('border-left-width', '3px');
  await expect(node.locator('.cherry-embed__preview svg')).toContainText('Previous');
  await page.evaluate(() => window.milkdownEditor!.setTheme('dark'));
  await expect(node.getByRole('alert')).toContainText('上一次成功渲染');
  await expect(node.locator('.cherry-embed__preview svg')).toContainText('Previous');
  await expect(source).toBeFocused();
  await source.fill('{"title":{"text":"Recovered"},"series":[]}');
  await expect(node.locator('svg')).toContainText('Recovered');
  await expect(node.getByRole('alert')).toHaveCount(0);
  await expect(source).toBeFocused();
});

errorTest('a failed table redraw labels the old chart and clears the warning on recovery', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/upload-harness.html?chart-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  const original = '| :line: | Value |\n| --- | --- |\n| Original | 1 |';
  await expect(page.locator('[data-test-chart]')).toHaveText('Original');
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original.replace('Original', 'Broken'));
  await expect(page.locator('[data-test-chart]')).toHaveText('Original');
  const warning = page.getByRole('alert');
  await expect(warning).toBeVisible();
  await expect(warning).toHaveCSS('border-left-width', '3px');
  await expect(warning).toContainText('上一次成功渲染');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => window.uploadEditor!.getMarkdown())).toContain('Broken');
  await page.evaluate(() => window.uploadEditor!.setTheme('dark'));
  await expect(warning).toBeVisible();
  await expect(warning).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await errorTest.info().attach('dark-warning', { body: await warning.screenshot(), contentType: 'image/png' });
  await expect(page.locator('[data-test-chart]')).toHaveText('Original');
  await page.evaluate((value) => window.uploadEditor!.setMarkdown(value), original.replace('Original', 'Fixed'));
  await expect(page.locator('[data-test-chart]')).toHaveText('Fixed');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

errorTest('chart warning remains readable across Cherry themes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/upload-harness.html?chart-failure');
  await page.waitForFunction(() => Boolean(window.uploadEditor));
  await expect(page.locator('[data-test-chart]')).toHaveText('Original');
  await page.evaluate(() => window.uploadEditor!.setMarkdown('| :line: | Value |\n| --- | --- |\n| Broken | 1 |'));
  const warning = page.getByRole('alert');
  await expect(warning).toBeVisible();
  for (const theme of ['default', 'dark', 'abyss', 'green', 'red', 'gray', 'violet', 'blue'] as const) {
    await page.evaluate((next) => window.uploadEditor!.setTheme(next), theme);
    const contrast = await warning.evaluate((element) => {
      const context = document.createElement('canvas').getContext('2d')!;
      const rgba = (value: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      let background = [255, 255, 255];
      const layers: number[][] = [];
      for (let node: Element | null = element; node; node = node.parentElement) {
        layers.push(rgba(getComputedStyle(node).backgroundColor));
      }
      for (const layer of layers.reverse()) {
        const alpha = layer[3] / 255;
        background = background.map((channel, index) => layer[index] * alpha + channel * (1 - alpha));
      }
      const foreground = rgba(getComputedStyle(element).color);
      const luminance = (color: number[]) => {
        const linear = color.slice(0, 3).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const text = luminance(foreground);
      const surface = luminance(background);
      return (Math.max(text, surface) + 0.05) / (Math.min(text, surface) + 0.05);
    });
    expect(contrast, `${theme} warning contrast`).toBeGreaterThanOrEqual(4.5);
    await expect(warning).toContainText('上一次成功渲染');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});

for (const replacement of ['text', 'chart'] as const) {
  test(`replacing charts with ${replacement} while their library loads cannot mount stale content`, async ({
    page,
  }) => {
    let requested = false;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/assets\/echarts-[^/]+\.js$/, async (route) => {
      requested = true;
      await gate;
      await route.continue();
    });
    try {
      await page.goto('/');
      await page.waitForFunction(() => Boolean(window.milkdownEditor));
      await expect.poll(() => requested).toBe(true);
      const next = replacement === 'text' ? 'Replacement' : '```echarts\n{"title":{"text":"Latest"},"series":[]}\n```';
      await setMarkdown(page, next);
      const response = page.waitForResponse(/\/assets\/echarts-[^/]+\.js$/);
      release();
      const loaded = await response;
      await page.evaluate(async (url) => {
        await import(/* @vite-ignore */ url);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      }, loaded.url());
      if (replacement === 'text') {
        await expect(page.locator('.ProseMirror')).toContainText('Replacement');
        await expect(page.locator('.cherry-echarts-wrapper')).toHaveCount(0);
      } else {
        const charts = page.locator('.cherry-echarts-wrapper svg');
        await expect(charts).toHaveCount(1);
        await expect(charts).toContainText('Latest');
      }
      expect(await markdown(page)).toBe(next);
    } finally {
      release();
    }
  });
}

for (const [kind, source] of [
  ['code', '```echarts\n{"series":[]}\n```'],
  ['table', '| :line: | Value |\n| --- | --- |\n| A | 1 |'],
] as const) {
  errorTest(`a ${kind} chart module failure stays local and ordinary text remains editable`, async ({ page }) => {
    const uncaught: string[] = [];
    page.on('pageerror', (error) => uncaught.push(error.message));
    await page.route(/\/assets\/echarts-[^/]+\.js$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: "throw new Error('simulated chart load failure');",
      }),
    );
    await page.route(/^https:\/\/geo\.datav\.aliyun\.com\/areas_v3\/bound\//, (route) =>
      route.fulfill({ contentType: 'application/json', body: '{"type":"FeatureCollection","features":[]}' }),
    );
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await setMarkdown(page, `Editable\n\n${source}`);
    await expect(page.locator('[data-render-error="true"] [role="alert"]')).toHaveCount(1);
    const paragraph = page.locator('.ProseMirror > p').first();
    const point = await paragraph.evaluate((element) => {
      const text = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)!;
      const range = document.createRange();
      range.selectNodeContents(text);
      const rect = range.getBoundingClientRect();
      return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
    });
    await page.mouse.click(point.x, point.y);
    await page.keyboard.type('X');
    await expect(paragraph).toContainText('X');
    expect(await markdown(page)).toContain(source);
    expect(uncaught).toEqual([]);
  });
}
