import assert from 'node:assert/strict';

/** Verify the installed editor does not mount an Engine stylesheet into its host page. */
export async function checkConsumerEngineSecurity(page, editorKey = 'consumerEditor') {
  await page.evaluate((key) => {
    document.body.dataset.engineStyleProbe = 'true';
    window[key].engine.makeHtml = () =>
      '<svg xmlns="http://www.w3.org/2000/svg"><style>body[data-engine-style-probe]{outline:17px solid red}</style>' +
      '<text>probe label</text></svg>';
    window[key].setMarkdown(':smile:');
  }, editorKey);
  const preview = page.locator('.cherry-embed--cherry_emoji');
  await preview.locator('svg text').waitFor();
  assert.equal(await preview.locator('style').count(), 0, 'Engine stylesheet must not be mounted');
  assert.notEqual(
    await page.locator('body').evaluate((body) => getComputedStyle(body).outlineWidth),
    '17px',
    'Engine stylesheet must not affect the host page',
  );
  await page.evaluate((key) => {
    window[key].setMarkdown('');
    window[key].engine.makeHtml = () =>
      '<span data-engine-overlay style="position:fixed;inset:0;z-index:2147483647">emoji</span>';
    window[key].setMarkdown(':smile:');
  }, editorKey);
  const overlay = preview.locator('[data-engine-overlay]');
  await overlay.waitFor();
  assert.notEqual(await overlay.evaluate((element) => element.style.position), 'fixed', 'Engine cannot fix an overlay');

  const requests = [];
  const routeProbe = async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 204 });
  };
  await page.route('https://example.com/engine-css-probe', routeProbe);
  try {
    await page.evaluate((key) => {
      window[key].setMarkdown('');
      window[key].engine.makeHtml = () =>
        `<span data-engine-image-set style="display:inline-block;width:20px;height:20px;--image:'https://example.com/engine-css-probe';background-image:image-set(var(--image) 1x)">emoji</span>`;
      window[key].setMarkdown(':smile:');
    }, editorKey);
    const imageSet = preview.locator('[data-engine-image-set]');
    await imageSet.waitFor();
    assert.equal(await imageSet.evaluate((element) => getComputedStyle(element).backgroundImage), 'none');
    await page.waitForTimeout(250);
    assert.deepEqual(requests, [], 'Engine CSS variables cannot trigger image-set requests');
  } finally {
    await page.unroute('https://example.com/engine-css-probe', routeProbe);
  }
  await page.evaluate((key) => {
    window[key].setMarkdown('');
    window[key].engine.makeHtml = () =>
      '<a data-engine-data-link href="data:image/svg+xml,%3Csvg%3E">emoji</a>' +
      '<img data-engine-data-image src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">';
    window[key].setMarkdown(':smile:');
  }, editorKey);
  const dataLink = preview.locator('[data-engine-data-link]');
  await dataLink.waitFor();
  assert.equal(await dataLink.getAttribute('href'), null, 'Engine data links must not be clickable');
  const dataImage = preview.locator('[data-engine-data-image]');
  await dataImage.evaluate((element) => element.decode());
  assert.equal(await dataImage.evaluate((element) => element.naturalWidth), 1, 'Engine image data must still render');
}
