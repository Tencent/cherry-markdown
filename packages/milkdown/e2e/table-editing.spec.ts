import { expect, markdown, replaceTableCell, setMarkdown, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
});

for (const chart of [false, true]) {
  const kind = chart ? 'chart table' : 'ordinary table';
  const value = `| ${chart ? ':line:{"title":"Editing"}' : 'Series'} | Jan | Feb |\n| --- | --- | --- |\n| Sales revenue | 1 | 2 |\n| Costs | 8 | 9 |`;

  test(`${kind}: repeated pointer edits, deletion and undo stay in their own cells`, async ({ page }) => {
    await setMarkdown(page, value);
    const table = page.locator('.milkdown-table-block').first();
    const cells = table.locator('td p');
    if (chart) await expect(page.locator('.cherry-table-chart svg')).toBeVisible();
    const geometry = await table.boundingBox();
    for (let round = 0; round < 4; round += 1) {
      const label = `Revenue ${round}`;
      const first = String(31 + round);
      const second = String(47 + round);
      const expected = [label, first, second, 'Costs', '8', '9'];
      await replaceTableCell(page, cells.nth(0), label);
      await replaceTableCell(page, cells.nth(1), first);
      await replaceTableCell(page, cells.nth(2), second);
      await expect(cells).toHaveText(expected);

      await replaceTableCell(page, cells.nth(1), '');
      await expect(cells).toHaveText([label, '', second, 'Costs', '8', '9']);
      await page.keyboard.press('ControlOrMeta+z');
      await expect(cells).toHaveText(expected);
      await page.keyboard.press('ControlOrMeta+Shift+z');
      await expect(cells).toHaveText([label, '', second, 'Costs', '8', '9']);
      await page.keyboard.press('ControlOrMeta+z');
      await expect(cells).toHaveText(expected);

      if (chart) {
        await expect
          .poll(() => page.locator('.cherry-table-chart .cherry-echarts-wrapper').getAttribute('data-table-data'))
          .toContain(JSON.stringify([label, first, second]));
      }
      expect((await table.boundingBox())!.x).toBeCloseTo(geometry!.x, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
        await page.evaluate(() => document.documentElement.clientWidth),
      );
    }
  });

  test(`${kind}: Tab and Shift+Tab select the next cell rather than the old label`, async ({ page }) => {
    await setMarkdown(page, value);
    const cells = page.locator('.milkdown-table-block').first().locator('td p');
    await cells.nth(0).click({ clickCount: 3 });
    await page.keyboard.press('Tab');
    await page.keyboard.type('53');
    await expect(cells).toHaveText(['Sales revenue', '53', '2', 'Costs', '8', '9']);
    await page.keyboard.press('Tab');
    await page.keyboard.type('64');
    await expect(cells).toHaveText(['Sales revenue', '53', '64', 'Costs', '8', '9']);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.type('75');
    await expect(cells).toHaveText(['Sales revenue', '75', '64', 'Costs', '8', '9']);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(cells).toHaveText(['Sales revenue', '53', '64', 'Costs', '8', '9']);
  });

  test(`${kind}: single clicks insert and delete at the clicked caret after repeated cell switches`, async ({
    page,
  }) => {
    await setMarkdown(page, value);
    const cells = page.locator('.milkdown-table-block').first().locator('td p');
    for (let round = 0; round < 3; round += 1) {
      for (const index of [1, 2]) {
        // Click the visible glyph, not the table-border insertion affordance.
        // The range is read only for geometry; selection uses native events.
        await cells.nth(index).scrollIntoViewIfNeeded();
        const point = await cells.nth(index).evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const rect = range.getBoundingClientRect();
          return { x: rect.right - 1, y: rect.y + rect.height / 2 };
        });
        await page.mouse.click(point.x, point.y);
        await page.keyboard.type('7');
        await expect(cells).toHaveText([
          'Sales revenue',
          index === 1 ? '17' : '1',
          index === 2 ? '27' : '2',
          'Costs',
          '8',
          '9',
        ]);
        await page.keyboard.press('ControlOrMeta+z');
        await expect(cells).toHaveText(['Sales revenue', '1', '2', 'Costs', '8', '9']);
        await page.keyboard.press('ControlOrMeta+Shift+z');
        await expect(cells.nth(index)).toHaveText(index === 1 ? '17' : '27');
        await page.keyboard.press('Backspace');
        await expect(cells).toHaveText(['Sales revenue', '1', '2', 'Costs', '8', '9']);
      }
    }
  });

  test(`${kind}: formatting and refocusing another cell preserve its content boundary`, async ({ page }) => {
    await setMarkdown(page, value);
    const cells = page.locator('.milkdown-table-block').first().locator('td p');
    await cells.nth(0).dblclick({ position: { x: 6, y: 10 }, delay: 80 });
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('Sales');
    const bubble = page.getByRole('toolbar', { name: '文本格式' });
    await expect(bubble).toBeVisible();
    await bubble.getByRole('button', { name: '加粗', exact: true }).click();
    await expect(cells.nth(0).locator('strong')).toHaveText('Sales');
    await replaceTableCell(page, cells.nth(2), '86');
    await expect(cells).toHaveText(['Sales revenue', '1', '86', 'Costs', '8', '9']);
    expect(await markdown(page)).toContain('**Sales** revenue');
    await expect(cells.nth(1).locator('strong')).toHaveCount(0);
    await expect(cells.nth(2).locator('strong')).toHaveCount(0);
    await expect(bubble).toBeHidden();
  });
}

test('an incomplete chart descriptor keeps its preview only until leaving that header or an external write', async ({
  page,
}) => {
  const value = '| :line:{"title":"Draft"} | Jan |\n| --- | --- |\n| Sales | 1 |';
  for (const boundary of ['cell', 'blur', 'external']) {
    await setMarkdown(page, value);
    const chart = page.locator('.cherry-table-chart');
    const descriptor = page.locator('.milkdown-table-block th p').first();
    await expect(chart.locator('svg')).toBeVisible();
    await replaceTableCell(page, descriptor, ':bar:{');
    await expect(chart.locator('svg')).toBeVisible();
    expect(await markdown(page)).toContain(':bar:{');
    if (boundary === 'cell') {
      await page.locator('.milkdown-table-block td p').first().click();
    } else if (boundary === 'blur') {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    } else {
      await setMarkdown(page, value.replace(':line:{"title":"Draft"}', 'Series'));
    }
    await expect(chart).toHaveCount(0);
    await expect(page.locator('.milkdown-table-block')).toBeVisible();
  }
});

test('lazy chart loading cannot move the focused table cell before its next keystroke', async ({ page }, info) => {
  let release = () => {};
  const loading = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route(/\/echarts(?:-[\w-]+)?\.js(?:\?|$)/, async (route) => {
    requests += 1;
    await loading;
    await route.continue();
  });
  try {
    await page.reload();
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await expect.poll(() => requests).toBeGreaterThan(0);
    await setMarkdown(page, '| :line:{"title":"Lazy"} | Jan |\n| --- | --- |\n| Sales revenue | 1 |');
    const chart = page.locator('.cherry-table-chart');
    const paragraph = page.locator('.milkdown-table-block td p').first();
    await expect(chart.locator('> .cherry-table-chart__preview')).toBeVisible();
    await expect(chart.locator('svg')).toHaveCount(0);
    const before = await paragraph.boundingBox();
    const point = await paragraph.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return { x: rect.right - 1, y: rect.y + rect.height / 2 };
    });
    await page.mouse.click(point.x, point.y);
    release();
    await expect(chart.locator('svg')).toBeVisible();
    const after = await paragraph.boundingBox();
    await info.attach('lazy-chart-cell-geometry', {
      body: JSON.stringify({ before, after }),
      contentType: 'application/json',
    });
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
    await page.keyboard.type(' edited');
    await expect(paragraph).toHaveText('Sales revenue edited');
    await expect(page.locator('.milkdown-table-block td p').nth(1)).toHaveText('1');
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
