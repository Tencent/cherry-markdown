import { expect, markdown, replaceTableCell, setMarkdown, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

test('Cherry legacy chart options and entity text share the native table editor', async ({ page }) => {
  const source = '| :line:{title: Sales & Costs, show: true} | Jan |\n| --- | --- |\n| Revenue | 1 |';
  await setMarkdown(page, source);
  const chart = page.locator('.cherry-table-chart .cherry-echarts-wrapper');
  await expect(chart.locator('svg')).toContainText('Sales & Costs');
  await expect(chart).toHaveAttribute('data-chart-options', /"title":"Sales & Costs"/);
  expect(await markdown(page)).toBe(source);
  const cell = page.locator('.milkdown-table-block td p').last();
  await replaceTableCell(page, cell, '27');
  await expect.poll(() => chart.getAttribute('data-table-data')).toContain('["Revenue","27"]');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(cell).toHaveText('1');
});

test('map data URLs retain query separators through Cherry parsing', async ({ page }) => {
  let requested = '';
  await page.route('https://maps.example/**', async (route) => {
    requested = route.request().url();
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
    });
  });
  const source =
    '| :map:{"title":"Query","mapDataSource":"https://maps.example/china.json?a=1&b=2"} | Value |\n| --- | --- |\n| 北京 | 100 |';
  await setMarkdown(page, source);
  await expect(page.locator('.cherry-table-chart .cherry-echarts-wrapper')).toHaveAttribute(
    'data-map-status',
    'success',
  );
  expect(requested).toBe('https://maps.example/china.json?a=1&b=2');
  expect(await markdown(page)).toBe(source);
});

test('editing one large table retains every other chart and native table DOM', async ({ page }, info) => {
  const source = Array.from({ length: 5 }, (_, chart) => {
    const rows = Array.from({ length: 100 }, (_, row) => `| Row ${row} | ${row + 1} |`).join('\n');
    return `| :line:{"title":"Chart ${chart}"} | Value |\n| --- | --- |\n${rows}`;
  }).join('\n\n');
  const start = Date.now();
  await setMarkdown(page, source);
  const charts = page.locator('.cherry-table-chart > .cherry-table-chart__preview .cherry-echarts-wrapper');
  await expect(charts).toHaveCount(5);
  const coldRenderMs = Date.now() - start;
  const cell = page.locator('.milkdown-table-block').first().locator('td p').first();
  await cell.click({ clickCount: 3 });
  await expect(page.locator('.ProseMirror .selectedCell')).toHaveCount(1);
  // Snapshot after Milkdown establishes CellSelection; its own table component
  // may rebuild selection chrome before editing begins.
  const widgets = await page.locator('.cherry-table-chart').elementHandles();
  const tables = await page.locator('.milkdown-table-block table').elementHandles();
  const others = await charts.elementHandles();
  const editStart = Date.now();
  const label = `Revenue ${'x'.repeat(40)}`;
  await page.keyboard.type(label);
  await expect.poll(() => charts.first().getAttribute('data-table-data')).toContain(label);
  for (let i = 0; i < 5; i++) {
    expect(
      await page
        .locator('.cherry-table-chart')
        .nth(i)
        .evaluate((element, original) => element === original, widgets[i]),
    ).toBe(true);
    expect(
      await page
        .locator('.milkdown-table-block table')
        .nth(i)
        .evaluate((element, original) => element === original, tables[i]),
      `editable table ${i} retains its DOM`,
    ).toBe(true);
    if (i > 0) expect(await charts.nth(i).evaluate((element, original) => element === original, others[i])).toBe(true);
  }
  await info.attach('table-performance', {
    contentType: 'application/json',
    body: JSON.stringify({ tables: 5, rows: 500, coldRenderMs, editRoundTripMs: Date.now() - editStart }),
  });
  expect(await markdown(page)).toContain(label);
});
