# @cherry-markdown/miniProgram

> [!WARNING]
>
> This package is in early development. Stability and completeness have not yet reached production level. Use with caution in production environments.

[简体中文](./README.CN.md)

## Purpose

`@cherry-markdown/miniProgram` converts Cherry Markdown into structured, WXML-friendly view data. It does not ship a WXML component, styles, or interaction handlers: consumers render the returned blocks and runs with their own MiniProgram templates.

Core Markdown structures can be rendered with native MiniProgram components and do not require WebView or DOM. Unknown or complex HTML is returned as an `html` block; consumers may render that block with `rich-text` as a fallback.

## Usage

```sh
npm install @cherry-markdown/miniProgram
```

Choose the entry that matches your rendering flow. Both constructors create and own their Cherry engine; normal usage does not call `createMiniProgramEngine`.

Use `MiniProgramStream` for one-shot Markdown and `createMiniProgramStreamAdapter` for an accumulated stream. The adapter keeps SSE framing and incomplete Markdown handling inside the package.

### Stream rendering

```js
import { createMiniProgramStreamAdapter } from '@cherry-markdown/miniProgram';

const page = this;
const adapter = createMiniProgramStreamAdapter();
let finished = false;

function applyState(state) {
  if (state) {
    page.setData({ blocks: state.blocks, streaming: state.streaming });
  }
}

function finishStream() {
  if (finished) return;
  finished = true;
  applyState(adapter.complete());
}

const requestTask = wx.request({
  url: 'https://your-llm-endpoint',
  enableChunked: true,
  responseType: 'arraybuffer',
  success() {
    // Response chunks have already been received by onChunkReceived.
  },
  fail(error) {
    wx.showToast({ title: error.errMsg || 'Request failed', icon: 'none' });
  },
  complete() {
    finishStream();
  },
});

requestTask.onChunkReceived(({ data }) => {
  const state = adapter.appendSseChunk(data);
  applyState(state);
  if (state?.done) {
    finished = true;
  }
});
```

`onChunkReceived` receives each `ArrayBuffer` as it arrives. `appendSseChunk()` internally handles UTF-8 boundaries, SSE frames, JSON `content`/`delta`/`text` payloads, and `[DONE]`. `complete()` flushes a trailing frame and closes the adapter when the server does not send `[DONE]`.

`append()` re-renders the accumulated Markdown for correctness with incomplete syntax. For high-frequency model output, batch page-level `setData` calls (for example, every 50-100 ms) instead of updating for every chunk.

### Static rendering

```js
import MiniProgramStream from '@cherry-markdown/miniProgram';

const stream = new MiniProgramStream();
this.setData({ blocks: stream.setMarkdownView('# Hello\nMarkdown content') });
```

## Module Formats

| Entry                          | ESM                       |
| ------------------------------ | ------------------------- |
| `@cherry-markdown/miniProgram` | `dist/miniProgram.esm.js` |

## Supported Features

| Feature       | Syntax                          | Render                                   | Status |
| ------------- | ------------------------------- | ---------------------------------------- | ------ |
| Paragraph     | plain text                      | Native `view` + `text` runs              | ✅     |
| Heading       | `#` `##` `###`                  | Native `view` with level class           | ✅     |
| Blockquote    | `>`                             | Native child-block data                  | ✅     |
| List          | `-` / `1.`                      | Flexbox + marker text                    | ✅     |
| Task List     | `- [x]` / `- [ ]`               | Flexbox, `☑`/`☐` markers                 | ✅     |
| Table         | `\| A \| B \|`                  | Native table rows and cell runs          | ✅     |
| Code Block    | ` ```lang ``` `                 | Highlight runs; template adds copy       | ✅     |
| Image         | `![alt](src)`                   | Native image run; template adds preview  | ✅     |
| Link          | `[text](url)`                   | Text run with `href`; template binds tap | ✅     |
| Math Inline   | `$E=mc^2$`                      | Formula source in a text run             | ✅     |
| Math Block    | `$$...$$`                       | Formula source block, not typeset        | ✅     |
| Mermaid       | ` ```mermaid ``` `              | Mermaid source block, not a diagram      | ✅     |
| Bold          | `**text**`                      | `class="md-strong"`                      | ✅     |
| Italic        | `*text*`                        | `class="md-em"`                          | ✅     |
| Inline Code   | `` `code` ``                    | `class="md-inline-code"`                 | ✅     |
| Underline     | `++text++`                      | `class="md-underline"`                   | ✅     |
| Strikethrough | `~~text~~`                      | `class="md-strike"`                      | ✅     |
| Sub / Sup     | `~text~` / `^text^`             | Inline text with class                   | ✅     |
| Line Break    | two trailing spaces             | `\n` in text run                         | ✅     |
| AutoLink      | `https://...`                   | Same as link                             | ✅     |
| Emoji         | `:smile:`                       | Image component                          | ✅     |
| Cursor        | stream only                     | `\|` cursor symbol                       | ✅     |
| Footnote ref  | `[^key]`                        | Sup/link data; template owns navigation  | ✅     |
| Panel         | `:::tip/warning/danger/success` | Plain paragraph, styling lost            | ❌     |
| Footnote body | generated content               | Plain paragraphs, styling lost           | ❌     |
| Color / Size  | `==color=red text==`            | Attr preserved, WXML ignores             | ❌     |
| Align         | `:::left/center/right`          | CSS class not consumed                   | ❌     |
| Toc           | `[TOC]`                         | List structure ok, styling lost          | ❌     |
| Hr            | `---`                           | Rich-text fallback                       | ❌     |
| Detail        | `+++`                           | Rich-text fallback, static               | ❌     |
| Ruby          | `{ Ruby }`                      | Rich-text fallback                       | ❌     |
| Raw HTML      | `<div>...</div>`                | Rich-text fallback                       | ❌     |
| SuggestList   | editor only                     | Not rendering                            | —      |
| FrontMatter   | `---yaml---`                    | Not rendered by default                  | —      |

The package returns WXML-friendly data only. The bundled Demo shows one template implementation for common blocks, code copy, image preview, link handling, and `html` fallback; applications must provide their own template, styles, and event handlers.

## Demo

A complete WeChat MiniProgram demo is available at `examples/miniProgram`.

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram.esm.js examples/miniProgram/miniprogram/vendor/cherry-mini-program.js
```

Open `examples/miniProgram` in WeChat DevTools.

## License

Apache-2.0. See [LICENSE](./LICENSE).
