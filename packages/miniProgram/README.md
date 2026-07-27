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

| Paragraph | plain text | Native `view` + `text` runs | ✅ |
| Heading | `#` `##` `###` | Native `view` with level class | ✅ |
| Blockquote | `>` | Native `view`, recursive children | ✅ |
| List | `-` / `1.` | Flexbox + marker text | ✅ |
| Task List | `- [x]` / `- [ ]` | Flexbox, `☑`/`☐` markers | ✅ |
| Table | `\| A \| B \|` | Flexbox + scroll, interactive cells | ✅ |
| Code Block | ` ```lang ``` ` | Token highlight, copy button | ✅ |
| Image | `![alt](src)` | Native `image`, preview on tap | ✅ |
| Link | `[text](url)` | Native `text` + `bindtap` | ✅ |
| Math Inline | `$E=mc^2$` | Monospace `text` with class | ✅ |
| Math Block | `$$...$$` | Monospace `text` with class | ✅ |
| Mermaid | ` ```mermaid ``` ` | Source code card, copy source | ✅ |
| Bold | `**text**` | `class="md-strong"` | ✅ |
| Italic | `*text*` | `class="md-em"` | ✅ |
| Inline Code | `` `code` `` | `class="md-inline-code"` | ✅ |
| Underline | `++text++` | `class="md-underline"` | ✅ |
| Strikethrough | `~~text~~` | `class="md-strike"` | ✅ |
| Sub / Sup | `~text~` / `^text^` | Inline text with class | ✅ |
| Line Break | two trailing spaces | `\n` in text run | ✅ |
| AutoLink | `https://...` | Same as link | ✅ |
| Emoji | `:smile:` | Image component | ✅ |
| Cursor | (stream only) | `|` cursor symbol | ✅ |
| Footnote ref | `[^key]` | Sup + link | ✅ |
| Panel | `:::tip/warning/danger/success` | Plain paragraph, styling lost | ❌ |
| Footnote body | (auto-generated) | Plain paragraphs, styling lost | ❌ |
| Color / Size | `==color=red text==` | Attr preserved, WXML ignores | ❌ |
| Align | `:::left/center/right` | CSS class not consumed | ❌ |
| Toc | `[TOC]` | List structure ok, styling lost | ❌ |
| Hr | `---` | Rich-text fallback | ❌ |
| Detail | `+++` | Rich-text fallback, static | ❌ |
| Ruby | `{ Ruby }` | Rich-text fallback | ❌ |
| Raw HTML | `<div>...</div>` | Rich-text fallback | ❌ |
| SuggestList | (editor only) | Not rendering | — |
| FrontMatter | `---yaml---` | Not rendered by default | — |

Core markdown features (headings, paragraphs, lists, tables, code blocks, images, links, math, inline formatting) are all natively rendered with full interaction (code copy, image preview, link navigation).

## Demo

A complete WeChat MiniProgram demo is available at `examples/miniProgram`.

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

Open `examples/miniProgram` in WeChat DevTools.
