# Cherry Markdown MiniProgram Demo

Minimal WeChat MiniProgram demo for rendering Cherry Markdown with `@cherry-markdown/miniProgram`.

## Run

From the repository root:

```sh
yarn workspace @cherry-markdown/miniProgram build
cp packages/miniProgram/dist/stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

Then open `examples/miniProgram` in WeChat DevTools. This demo uses a local vendor bundle, so **Build npm is not required**.

The MiniProgram package entry is DOM-free; app pages do not need to add `window`, `self`, or `globalThis` shims.

The demo avoids remote images and timer polling to keep DevTools from reporting unrelated internal timeout warnings during startup.

If DevTools still shows an old npm resolution error, clear cache or recompile after confirming `pages/index/index.js` requires:

```js
require('../../vendor/cherry-mini-program-stream');
```

## What This Demo Covers

- Basic Markdown to MiniProgram Block AST with `MiniProgramStream`.
- Native WXML rendering for paragraph, heading, list, blockquote, code, image, and link nodes.
- Stream updates with a chunk queue flushed by `setData` callbacks.
- The demo uses a small timer only to simulate delayed chunk arrival; real SSE/WebSocket integrations can call `enqueueStreamChunk(chunk)` directly from message callbacks.
- Native interactions:
  - code copy with `wx.setClipboardData`
  - image preview with `wx.previewImage`
  - link tap with page navigation or a modal fallback
- Fallback `html` blocks rendered through `<rich-text>`.

This is intentionally only a demo renderer, not a bundled component package.
