import { expect, markdown, test } from './fixtures';

function chartDocument(revision: number) {
  return [
    `Revision ${revision}`,
    '',
    '| :line:{"title":"Table settings"} | Jan | Feb |',
    '| --- | --- | --- |',
    `| Demo sales | ${revision} | ${revision + 1} |`,
    '',
    '```echarts',
    `{animation:false,title:{text:"Code settings"},xAxis:{type:"category",data:["Jan","Feb"]},yAxis:{},series:[{name:"Demo sales",type:"line",data:[${revision},${revision + 1}],label:{show:true}}]}`,
    '```',
  ].join('\n');
}

test('bursts of external writes and redraws keep the latest data and subsequent native editing', async ({ page }, info) => {
  await page.goto('/?chart-transform=1');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  const started = Date.now();
  // Mix synchronous bursts with animation frames so both pending and mounted
  // renderer resources are replaced, rather than testing only a final parse.
  for (let batch = 0; batch < 12; batch += 1) {
    await page.evaluate((documents) => {
      for (const document of documents) {
        window.milkdownEditor!.setMarkdown(document, { emit: false });
        window.dispatchEvent(new Event('cherry:export:done'));
      }
    }, Array.from({ length: 5 }, (_, offset) => chartDocument(batch * 5 + offset + 1)));
    await page.evaluate((batch) => {
      window.milkdownEditor!.setTheme(batch % 2 ? 'default' : 'dark');
      return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }, batch);
  }
  const expected = chartDocument(60);
  await expect.poll(() => markdown(page)).toBe(expected);
  await expect(page.locator('[data-cherry-milkdown]')).toHaveCount(1);
  await expect(page.locator('.cherry-echarts-wrapper svg')).toHaveCount(2);
  const code = page.locator('.cherry-echarts-codeblock-wrapper svg');
  await expect(code.getByText('600', { exact: true }).first()).toBeVisible();
  await expect(code.getByText('610', { exact: true })).toBeVisible();
  await expect(page.locator('.cherry-table-chart--derived svg')).toContainText('Table settings');
  await expect(page.locator('.cherry-table-chart--derived svg').getByText('600', { exact: true }).first()).toBeVisible();

  const paragraph = page.locator('.ProseMirror > p').first();
  await paragraph.click();
  await expect(page.locator('.ProseMirror')).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await expect(paragraph).toHaveText('Revision 60 edited');
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(() => markdown(page)).toBe(expected);
  await info.attach('burst-duration-ms', { body: String(Date.now() - started), contentType: 'text/plain' });
});

test('destroy during pending renders removes owned controls and tolerates later global events', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await page.evaluate(async (source) => {
    window.milkdownEditor!.setMarkdown(source);
    await window.milkdownEditor!.destroy();
    await window.milkdownEditor!.destroy();
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('cherry:export:done'));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, `${chartDocument(1)}\n\n\`\`\`mermaid\ngraph LR\n A-->B\n\`\`\``);
  await expect(page.locator('[data-cherry-milkdown], .ProseMirror, [role="toolbar"]')).toHaveCount(0);
});
