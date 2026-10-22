import { test as base, expect, type Locator, type Page } from '@playwright/test';

export async function markdown(page: Page) {
  return page.evaluate(() => window.milkdownEditor!.getMarkdown());
}

export async function setMarkdown(page: Page, value: string) {
  await page.evaluate((value) => window.milkdownEditor!.setMarkdown(value), value);
}

/** Keep table edits on the real pointer/keyboard path, not fill()'s DOM-only range. */
export async function replaceTableCell(page: Page, paragraph: Locator, value: string) {
  // ProseMirror tables use triple-click for CellSelection, not a DOM text range.
  await paragraph.click({ clickCount: 3 });
  await expect(paragraph.locator('..')).toHaveClass(/selectedCell/);
  await expect(page.locator('.ProseMirror .selectedCell')).toHaveCount(1);
  if (value) await page.keyboard.type(value);
  else await page.keyboard.press('Backspace');
  await expect(paragraph).toHaveText(value);
}

/** All interaction and visual tests share the same runtime-error gate. */
export const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [
    async ({ page }, use, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await use(errors);
      const renderErrors = await page
        .locator('[role="alert"]:visible, [data-render-error="true"]:visible')
        .allTextContents();
      await info.attach('runtime-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
      await info.attach('renderer-errors', { body: JSON.stringify(renderErrors), contentType: 'application/json' });
      const finalMarkdown = await page.evaluate(() => window.milkdownEditor?.getMarkdown()).catch(() => undefined);
      if (finalMarkdown) await info.attach('final-markdown', { body: finalMarkdown, contentType: 'text/markdown' });
      expect(errors).toEqual([]);
      expect(renderErrors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
