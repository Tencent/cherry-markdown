import assert from 'node:assert/strict';

/** Exercise the installed package when its custom Engine destroys during rendering. */
export async function checkConsumerEngineDestroy(page) {
  for (const image of [false, true]) {
    const result = await page.evaluate((image) => window.consumerEngineDestroy(image), image);
    assert.deepEqual(result, {
      before: image ? 'https://example.com/initial.png' : 'initial',
      remaining: 0,
    });
  }
}

/** Image failures must stay local and a later update must recover. */
export async function checkConsumerEngineImageFailure(page) {
  const result = await page.evaluate(() => window.consumerEngineImageFailure());
  assert.equal(result.original, 'https://example.com/original.png');
  assert.equal(result.unsafe, null);
  assert.equal(result.recovered, 'https://example.com/recovered.png');
  assert.equal(result.markdown, 'Text\n\n![picture](https://example.com/updated.png)');
  assert.ok(result.errors.includes('render: Error: Image engine failed'));
}
