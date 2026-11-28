import { expect, markdown, replaceTableCell, setMarkdown, test } from './fixtures';

test('keeps the option and Markdown while replacing chart data across redraws', async ({ page }) => {
  await page.goto('/?chart-transform=1');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  expect(await page.locator('[data-cherry-milkdown]').evaluate((el) => Boolean(el.shadowRoot))).toBe(true);
  const source = [
    '| :line:{"title":"Table settings"} | Jan | Feb |',
    '| --- | --- | --- |',
    '| Demo sales | 8 | 10 |',
    '',
    '```echarts',
    '{title:{text:"Code settings"},xAxis:{type:"category",data:["Jan","Feb"]},yAxis:{},series:[{name:"Demo sales",type:"line",data:[8,10],label:{show:true}}]}',
    '```',
  ].join('\n');
  await page.addStyleTag({
    content: '#markdown { --milkdown-chart-height: 270px; }',
  });
  await setMarkdown(page, source);
  await expect(page.locator('[part="chart"]').first()).toHaveCSS('height', '270px');
  const tableSvg = page.locator('.cherry-table-chart--derived svg').first();
  const codeSvg = page.locator('.cherry-echarts-codeblock-wrapper svg').first();
  const checkCharts = async (tableTick: string) => {
    await expect(tableSvg.getByText('Table settings', { exact: true })).toBeVisible();
    await expect(tableSvg.getByText('Jan', { exact: true })).toBeVisible();
    await expect(tableSvg.getByText(tableTick, { exact: true }).first()).toBeVisible();
    await expect(codeSvg.getByText('Code settings', { exact: true })).toBeVisible();
    await expect(codeSvg.getByText('Jan', { exact: true })).toBeVisible();
    await expect(codeSvg.getByText('80', { exact: true }).first()).toBeVisible();
    await expect(codeSvg.getByText('100', { exact: true }).first()).toBeVisible();
  };
  await checkCharts('100');
  expect(await markdown(page)).toBe(source);

  await page.evaluate(() => {
    window.milkdownEditor!.setTheme('dark');
    window.dispatchEvent(new Event('cherry:export:done'));
  });
  await checkCharts('100');
  expect(await markdown(page)).toBe(source);

  await replaceTableCell(page, page.locator('.milkdown-table-block td p').nth(2), '20');
  await checkCharts('200');
  expect(await markdown(page)).toContain('| Demo sales | 8 | 20 |');
  expect(await markdown(page)).toContain('data:[8,10]');
});
