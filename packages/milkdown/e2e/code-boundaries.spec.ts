import { test, expect, markdown, setMarkdown } from './fixtures';

test('reference links keep document context across native blocks and code examples', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.milkdownEditor));
  await setMarkdown(
    page,
    '[ref]: https://example.com/real\n\n[[toc]]\n\n[link][ref]\n\n```text\n[ref]: https://example.com/code\n```',
  );
  const link = page.locator('.ProseMirror a').filter({ hasText: 'link' });
  await expect(link).toHaveAttribute('href', 'https://example.com/real');
  await setMarkdown(page, await markdown(page));
  await expect(link).toHaveAttribute('href', 'https://example.com/real');
});

for (const [label, source] of [
  ['indented', '    [[toc]]'],
  ['unclosed', '```text\n[[toc]]'],
  ['longer closer', '```text\n[[toc]]\n````'],
]) {
  test(`literal ${label} code survives native editing and reload`, async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.milkdownEditor));
    await setMarkdown(page, source);
    const code = page.locator('.ProseMirror pre code').first();
    await expect(code).toHaveText('[[toc]]');
    await code.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' literal');
    await expect(code).toHaveText('[[toc]] literal');
    const saved = await markdown(page);
    await setMarkdown(page, saved);
    await expect(code).toHaveText('[[toc]] literal');
  });
}
