# Cherry Markdown MiniProgram Demo

Minimal WeChat MiniProgram demo for stream rendering Markdown with `@cherry-markdown/miniProgram`.

## Run

From the repository root:

```sh
yarn workspace @cherry-markdown/miniProgram build
cp packages/miniProgram/dist/stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

Then open `examples/miniProgram` in WeChat DevTools. This demo uses a local vendor bundle, so **Build npm is not required**.

The MiniProgram package entry is DOM-free; app pages do not need to add `window`, `self`, or `globalThis` shims.

The demo avoids remote images, view-query polling, and extra image activation updates. The stream button starts an automatic token-sized SSE simulation through `createMiniProgramStreamAdapter`, so users do not need to tap for each token.

If DevTools still shows an old npm resolution error, clear cache or recompile after confirming `pages/index/index.js` requires:

```js
require('../../vendor/cherry-mini-program-stream');
```

## What This Demo Covers

- Basic Markdown to WXML-friendly view blocks with `createMiniProgramStreamAdapter`.
- Native WXML rendering for paragraph, heading, list, blockquote, code, image, and link nodes.
- CherryStream-like flow rendering: chunks are accumulated as Markdown, incomplete syntax is normalized, images are deferred while streaming, and final render restores native images.
- The direct render and stream render use the same Markdown source, so the final output can be compared directly.
- The demo button starts an automatic token-sized SSE simulation; real SSE/WebSocket integrations can pass response chunks to `createSseParser` and then feed events into the adapter.
- Native interactions:
  - code copy with `wx.setClipboardData`
  - image preview with `wx.previewImage`
  - link tap with page navigation or a modal fallback

## SSE Request Shape

```js
const { createMiniProgramStreamAdapter, createSseParser } = require('../../vendor/cherry-mini-program-stream');

const streamAdapter = createMiniProgramStreamAdapter();

function applyStreamState(state) {
  if (!state) return;
  this.setData({
    markdown: state.markdown,
    blocks: state.blocks,
    streaming: state.streaming,
  });
}

const parser = createSseParser({
  onMessage: (event) => {
    applyStreamState.call(this, streamAdapter.appendSseEvent(event));
  },
  onDone: () => {
    applyStreamState.call(this, streamAdapter.finish());
  },
});

const requestTask = wx.request({
  url: 'https://example.com/sse',
  method: 'POST',
  enableChunked: true,
  responseType: 'arraybuffer',
});

requestTask.onChunkReceived((res) => {
  parser.push(res.data);
});
```

This is intentionally a minimal project demo, not a bundled component package.
