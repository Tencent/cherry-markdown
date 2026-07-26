# @cherry-markdown/miniProgram

> [!WARNING]
>
> This package is in early development. Stability and completeness have not yet reached production level. Use with caution in production environments.

[简体中文](./README.CN.md)

## Purpose

`@cherry-markdown/miniProgram` provides WeChat MiniProgram native rendering adapters for Cherry Markdown. It converts Markdown into structured WXML-friendly view data, rendered entirely with native MiniProgram components — no WebView, no DOM, no `rich-text` HTML rendering for core features.

## Usage

```sh
npm install @cherry-markdown/miniProgram
```

The built file is at `node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js` after install.
Copy it to your MiniProgram project:

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js <your-miniprogram>/vendor/
```

### Stream rendering

```js
const { createMiniProgramStreamAdapter, createSseParser } = require('./vendor/miniProgram');

const adapter = createMiniProgramStreamAdapter();
const parser = createSseParser({
  onMessage: (event) => {
    const state = adapter.appendSseEvent(event);
    this.setData({ blocks: state.blocks, streaming: true });
  },
  onDone: () => {
    const state = adapter.finish();
    this.setData({ blocks: state.blocks, streaming: false });
  },
});

wx.request({
  url: 'https://your-llm-endpoint',
  enableChunked: true,
  responseType: 'arraybuffer',
  success(res) {
    parser.push(res.data);
  },
});
```

### Static rendering

```js
const MiniProgramStream = require('./vendor/miniProgram').default;
const stream = new MiniProgramStream();
this.setData({ blocks: stream.setMarkdownView('# Hello\nMarkdown content') });
```

## Supported Features

- **Paragraph, headings (h1-h6), blockquote, lists, task lists** — native view components
- **Tables** — flexbox layout with scroll, interactive cells (links, images)
- **Code blocks** — token-level syntax highlighting, copy button
- **Images** — native `<image>` component, preview on tap
- **Links** — native `<text>` with tap handler
- **Math (inline & block)** — monospace rendering
- **Mermaid diagrams** — source code card
- **Streaming** — chunk accumulation, incomplete syntax normalization, image deferral during stream
- **SSE integration** — built-in `createSseParser` for `text/event-stream`

> Some Cherry syntax features (Panel, Color, Detail, Ruby) fall back to `<rich-text>` rendering. See PR comments for full compatibility matrix.

## Demo

A complete WeChat MiniProgram demo is available at `examples/miniProgram`.

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

Open `examples/miniProgram` in WeChat DevTools.
