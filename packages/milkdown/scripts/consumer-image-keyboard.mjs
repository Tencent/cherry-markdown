import assert from 'node:assert/strict';

/** Exercise image selection and actions with the installed editor in a real browser. */
export async function checkConsumerImageKeyboard(page, editorKey = 'consumerEditor') {
  const source = 'Text ![original](https://example.com/original.png)';
  const imageUrl = 'https://example.com/original.png';
  const respond = (route) =>
    route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
    });
  await page.route(imageUrl, respond);
  try {
    await page.evaluate(({ key, source }) => window[key].setMarkdown(source), { key: editorKey, source });
    await page.locator('.ProseMirror').focus();
    const selected = page.locator('.ProseMirror img.ProseMirror-selectednode');
    for (const direction of ['ArrowRight', 'ArrowLeft']) {
      for (let step = 0; step < 'Text '.length + 2; step++) {
        if (await selected.count()) break;
        await page.keyboard.press(direction);
      }
    }
    await selected.waitFor();
    await page.keyboard.press('Alt+F10');
    const border = page.getByRole('toolbar', { name: '图片设置' }).getByRole('button', { name: '边框' });
    await border.waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '边框');
    assert.equal(await page.evaluate((key) => window[key].getMarkdown(), editorKey), source);
    await page.keyboard.press('Space');
    await page.waitForFunction((key) => window[key].getMarkdown().includes('#B'), editorKey);
    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForFunction(({ key, source }) => window[key].getMarkdown() === source, { key: editorKey, source });
    const image = page.locator('.ProseMirror img[alt="original"]');
    await page.locator('.ProseMirror').focus();
    // Undo need not retain image selection after earlier edits. Select it
    // again before exercising its remaining keyboard actions.
    if (!(await selected.count())) await image.click();
    await page.locator('.ProseMirror img.ProseMirror-selectednode').waitFor();
    await image.evaluate((element) =>
      element.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(0.99)' }], { duration: 1500 }),
    );
    await page.keyboard.press('Alt+F10');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '边框');
    assert.equal(await page.evaluate((key) => window[key].getMarkdown(), editorKey), source);
    await page.keyboard.press('Escape');
    await image.evaluate((element) =>
      element.animate([{ opacity: 0.8 }, { opacity: 1 }], { duration: 400, iterations: Infinity }),
    );
    await page.keyboard.press('Alt+F10');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '边框');
    assert.equal(await page.evaluate((key) => window[key].getMarkdown(), editorKey), source);
    await image.evaluate((element) => element.getAnimations().forEach((animation) => animation.cancel()));
    await page.keyboard.press('Escape');
    await image.evaluate((element) => (element.style.marginLeft = '250px'));
    await page.keyboard.press('Alt+F10');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '边框');
    await image.evaluate((element) => {
      element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(80px)' }], {
        duration: 2000,
        iterations: Infinity,
        direction: 'alternate',
      });
    });
    await page.waitForFunction(() => document.querySelector('.cherry-milkdown-image-frame').hidden);
    const positions = () =>
      page.evaluate(() => ({
        image: document.querySelector('.ProseMirror img:not(.ProseMirror-separator)').getBoundingClientRect().left,
        toolbar: document.querySelector('.cherry-milkdown-image-controls').getBoundingClientRect().left,
      }));
    const first = await positions();
    await page.waitForTimeout(300);
    const second = await positions();
    assert.ok(Math.abs(second.image - first.image) > 5, 'Image must move during the test');
    assert.ok(Math.abs(second.toolbar - first.toolbar - (second.image - first.image)) < 4, 'Toolbar must follow image');
    await page.keyboard.press('Escape');
    await image.evaluate((element) => element.getAnimations().forEach((animation) => animation.cancel()));
    await image.evaluate((element) => {
      element.style.width = '60px';
      element.style.height = '60px';
    });
    await page.keyboard.press('Alt+F10');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '边框');
    const handle = page.locator('[data-resize-handle="rightMiddle"]');
    await handle.waitFor({ state: 'visible' });
    const box = await handle.boundingBox();
    if (!box) throw new Error('Missing image resize handle');
    const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 10, start.y, { steps: 3 });
    await image.evaluate((element) =>
      element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(60px)' }], { duration: 2000 }),
    );
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.mouse.move(start.x + 25, start.y, { steps: 3 });
    await page.mouse.up();
    await image.evaluate((element) => element.getAnimations().forEach((animation) => animation.cancel()));
    assert.equal(await page.evaluate((key) => window[key].getMarkdown(), editorKey), source);
    await image.evaluate((element) => {
      const animation = element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(80px)' }], {
        duration: 2000,
        fill: 'both',
      });
      animation.pause();
      animation.currentTime = 0;
    });
    await page.locator('.ProseMirror').focus();
    await page.keyboard.press('Alt+F10');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '边框');
    const beforeSeek = await positions();
    await image.evaluate((element) => {
      const animation = element.getAnimations().find((candidate) => candidate.playState === 'paused');
      if (!animation) throw new Error('Missing paused animation');
      animation.currentTime = 1000;
    });
    await page.waitForFunction((before) => {
      const image = document.querySelector('.ProseMirror img:not(.ProseMirror-separator)').getBoundingClientRect().left;
      const toolbar = document.querySelector('.cherry-milkdown-image-controls').getBoundingClientRect().left;
      return image - before.image > 30 && Math.abs(toolbar - before.toolbar - (image - before.image)) < 4;
    }, beforeSeek);
    assert.equal(await page.evaluate((key) => window[key].getMarkdown(), editorKey), source);
    await page.keyboard.press('Escape');
    await image.evaluate((element) => element.getAnimations().forEach((animation) => animation.cancel()));
  } finally {
    await page.unroute(imageUrl, respond);
  }
}
