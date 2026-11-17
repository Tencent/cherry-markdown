import { test as base, expect, type Locator, type Page } from '@playwright/test';

/** Contrast for opaque CSS rgb() colors obtained from computed styles. */
export function colorContrast(first: string, second: string) {
  const luminance = (color: string) => {
    const match = color.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/);
    if (!match || (match[4] !== undefined && Number(match[4]) !== 1)) throw new Error(`Expected opaque RGB: ${color}`);
    return match
      .slice(1, 4)
      .map((channel) => Number(channel) / 255)
      .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  };
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export async function markdown(page: Page) {
  return page.evaluate(() => window.milkdownEditor!.getMarkdown());
}

export async function setMarkdown(page: Page, value: string) {
  await page.evaluate((value) => window.milkdownEditor!.setMarkdown(value), value);
}

/** Establish a stable selection before testing clipboard behavior. */
export async function placeTextCaret(page: Page, target: Locator, text: string, offset: number) {
  await target.click();
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect
    .poll(async () => {
      await target.evaluate(
        (element, { text, offset }) => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode()) && node.textContent !== text) {
            /* Find the editable text node. */
          }
          if (!node) throw new Error(`Missing text node: ${text}`);
          const range = document.createRange();
          range.setStart(node, offset);
          range.collapse(true);
          const selection = window.getSelection()!;
          selection.removeAllRanges();
          selection.addRange(range);
        },
        { text, offset },
      );
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
      return page.evaluate(() => ({
        text: window.getSelection()?.anchorNode?.textContent,
        offset: window.getSelection()?.anchorOffset,
      }));
    })
    .toEqual({ text, offset });
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
      // The demo's initial document contains maps. Keep unrelated editor
      // tests independent of the remote GeoJSON service and its CORS state;
      // dedicated map tests still exercise their own explicitly routed URLs.
      await page.route(/^https:\/\/geo\.datav\.aliyun\.com\/areas_v3\/bound\/(?:100000|110000)_full\.json$/, (route) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
        }),
      );
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
