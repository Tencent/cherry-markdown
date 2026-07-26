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

### Native WXML rendering

- Paragraph, headings (h1-h6), blockquote, lists, task lists
- Tables (flexbox, scrollable, interactive cells)
- Code blocks (token-level syntax highlighting, copy)
- Images (native `<image>`, preview on tap)
- Links (native `<text>`, tap handler)
- Math inline & block (monospace)
- Mermaid diagrams (source card)
- Strong, em, inline code, underline, strikethrough, sub, sup, br
- AutoLink, Emoji

### `<rich-text>` fallback (visible, no interaction)

- Hr, Detail/Details, Ruby, raw HTML

### Content visible but styling/behavior lost

- Panel (`:::tip/warning/danger/success`) — content renders as plain paragraphs, panel styling lost
- Color / BackgroundColor / Size — attribute preserved but WXML `<text>` does not support `style`
- Footnote list — footnote container styling lost (inline references render as sup link)
- Align / Justify — CSS class not consumed by WXML
- Toc — list structure renders, container styling lost

### Editor-only (not rendering)

- SuggestList, Suggester, FrontMatter, CommentReference

## Demo

A complete WeChat MiniProgram demo is available at `examples/miniProgram`.

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

Open `examples/miniProgram` in WeChat DevTools.
