/** Verify that an absent optional formula dependency does not block editing. */
export async function checkMissingMath(page) {
  await page.evaluate(() => {
    window.expectedMathError = true;
    window.consumerErrors = [];
    window.consumerEditor.setMarkdown('# Base\n\nText before\n\n$$\nx^2\n$$\n\nText after');
  });
  await page.waitForFunction(() =>
    window.consumerErrors.some(({ phase, message }) => phase === 'render' && /mathlive/i.test(message)),
  );
  await page.locator('.ProseMirror p').filter({ hasText: 'Text after' }).click();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await page.waitForFunction(() => {
    const markdown = window.consumerEditor.getMarkdown();
    return markdown.includes('x^2') && markdown.includes('Text before') && markdown.includes('Text after edited');
  });
  const unexpected = await page.evaluate(() =>
    window.consumerErrors.filter(({ phase, message }) => phase !== 'render' || !/mathlive/i.test(message)),
  );
  if (unexpected.length) throw new Error(`Unexpected consumer errors: ${JSON.stringify(unexpected)}`);
}
