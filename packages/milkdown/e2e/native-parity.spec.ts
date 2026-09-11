import { expect, test } from './fixtures';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const cases = [
  { name: 'heading', markdown: '# Heading', selector: 'h1', editSelector: 'h1' },
  { name: 'paragraph', markdown: 'Plain **bold** and `code`.', selector: 'p', editSelector: 'p' },
  { name: 'quote', markdown: '> Quoted text', selector: 'blockquote', editSelector: 'blockquote p' },
  { name: 'list', markdown: '- First\n- Second', selector: 'ul', editSelector: 'li p' },
  { name: 'task', markdown: '- [ ] Task\n- [x] Done', selector: 'ul', editSelector: 'li p' },
  {
    name: 'table',
    markdown: '| A | B |\n| --- | --- |\n| 1 | 2 |',
    selector: 'table',
    editableSelector: 'table.children',
    editSelector: 'table.children td p',
  },
  { name: 'image', markdown: '![dog#100px](assets/images/demo-dog.png)', selector: 'img' },
  {
    name: 'panel',
    markdown: '::: warning Title\nContent\n:::',
    selector: '.cherry-panel',
    editSelector: '.cherry-panel--body p',
  },
  { name: 'detail', markdown: '+++ More\nContent\n+++', selector: '.cherry-detail' },
  { name: 'code', markdown: '```javascript\nconst value = 1;\n```', selector: 'pre' },
];

for (const item of cases) {
  test(`native layout and focus stability: ${item.name}`, async ({ page }, info) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await page.evaluate(({ markdown }) => window.milkdownEditor!.setMarkdown(markdown), item);
    const actual = page
      .locator('.ProseMirror')
      .locator(item.editableSelector ?? item.selector)
      .first();
    await expect(actual).toBeVisible();
    await page.evaluate(({ markdown }) => {
      const oracle = document.createElement('div');
      // Match Cherry's real preview-only DOM contract. Comparing against a
      // bare `.cherry-markdown` would omit preview padding and use a false
      // full-viewport baseline.
      const actualPreview = document.querySelector<HTMLElement>('#markdown > .cherry > .cherry-previewer')!;
      oracle.className = actualPreview.className.replace(/\bcherry-milkdown\b/g, '').replace(/\s+/g, ' ').trim();
      oracle.dataset.nativeOracle = '';
      oracle.innerHTML = window.milkdownEditor!.engine.makeHtml(markdown);
      const shell = document.createElement('div');
      const actualShell = document.querySelector<HTMLElement>('#markdown > .cherry')!;
      for (const attribute of actualShell.attributes) shell.setAttribute(attribute.name, attribute.value);
      shell.dataset.nativeShell = '';
      shell.append(oracle);
      document.querySelector('#markdown')!.append(shell);
    }, item);
    const expected = page.locator('[data-native-oracle]').locator(item.selector).first();
    await expect(expected).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (item.name === 'image') {
      await page.waitForFunction(() => [...document.images].every((img) => img.complete));
    }
    const properties = [
      'color',
      'background-color',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'border-top-width',
      'border-radius',
    ];
    const styles = (locator: typeof actual) =>
      locator.evaluate((element, keys) => {
        const css = getComputedStyle(element);
        return Object.fromEntries(keys.map((key) => [key, css.getPropertyValue(key)]));
      }, properties);
    expect.soft(await styles(actual)).toEqual(await styles(expected));
    const initial = await actual.boundingBox();
    const native = await expected.boundingBox();
    expect.soft(initial!.width).toBeCloseTo(native!.width, 0);
    expect.soft(initial!.height).toBeCloseTo(native!.height, 0);
    await actual.scrollIntoViewIfNeeded();
    const captureOrigin = (await actual.boundingBox())!;
    // Capture inside the component, excluding a fractional final pixel that
    // may contain its parent's shadow rather than the component itself.
    const clip = { ...captureOrigin, width: Math.floor(captureOrigin.width), height: Math.floor(captureOrigin.height) };
    const actualImage = PNG.sync.read(
      await page.screenshot({ clip, animations: 'disabled', path: info.outputPath('milkdown.png') }),
    );
    // Align only capture origins. Different fractional Y positions otherwise
    // round identical-height elements to different PNG sizes (e.g. 68 vs 69px).
    await expected.evaluate((element, origin) => {
      const rect = element.getBoundingClientRect();
      const shell = element.closest<HTMLElement>('[data-native-shell]')!;
      const shellRect = shell.getBoundingClientRect();
      Object.assign(shell.style, {
        position: 'fixed',
        width: `${shellRect.width}px`,
        left: `${origin.x - (rect.x - shellRect.x)}px`,
        top: `${origin.y - (rect.y - shellRect.y)}px`,
      });
    }, captureOrigin);
    const nativeImage = PNG.sync.read(
      await page.screenshot({ clip, animations: 'disabled', path: info.outputPath('native.png') }),
    );
    await page.locator('[data-native-shell]').evaluate((element) => {
      for (const property of ['position', 'width', 'left', 'top'])
        (element as HTMLElement).style.removeProperty(property);
    });
    if (actualImage.width === nativeImage.width && actualImage.height === nativeImage.height) {
      const diff = new PNG({ width: actualImage.width, height: actualImage.height });
      const changed = pixelmatch(actualImage.data, nativeImage.data, diff.data, diff.width, diff.height, {
        threshold: 0.1,
      });
      await info.attach('native-pixel-diff', { body: PNG.sync.write(diff), contentType: 'image/png' });
      expect.soft(changed / (diff.width * diff.height)).toBeLessThanOrEqual(0.005);
    } else {
      expect.soft([actualImage.width, actualImage.height]).toEqual([nativeImage.width, nativeImage.height]);
    }
    await actual.click();
    const focused = await actual.boundingBox();
    expect.soft(focused!.width).toBeCloseTo(initial!.width, 0);
    expect.soft(focused!.height).toBeCloseTo(initial!.height, 0);
    expect.soft(await styles(actual)).toEqual(await styles(expected));
    if (item.editSelector) {
      const content = page.locator('.ProseMirror').locator(item.editSelector).first();
      await content.click();
      await page.keyboard.press('End');
      await page.keyboard.type(' edited');
      expect(await page.evaluate(() => window.milkdownEditor!.getMarkdown())).toContain(' edited');
      await page.evaluate(() => {
        document.querySelector('[data-native-oracle]')!.innerHTML = window.milkdownEditor!.engine.makeHtml(
          window.milkdownEditor!.getMarkdown(),
        );
      });
      const changed = await actual.boundingBox();
      const rendered = await expected.boundingBox();
      expect.soft(changed!.width).toBeCloseTo(rendered!.width, 0);
      expect.soft(changed!.height).toBeCloseTo(rendered!.height, 0);
      expect.soft(await styles(actual)).toEqual(await styles(expected));
    }
    await expect(page.locator('[role="alert"], [data-render-error="true"]')).toHaveCount(0);
  });
}
