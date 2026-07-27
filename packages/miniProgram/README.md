# @cherry-markdown/miniprogram

> [!WARNING]
>
> This package is in early development. Stability and completeness have not yet reached production level. Use with caution in production environments.

[简体中文](./README.CN.md)

## Purpose

`@cherry-markdown/miniprogram` converts Cherry Markdown into structured, WXML-friendly view data. It does not ship a WXML component, styles, or interaction handlers: consumers render the returned blocks and runs with their own MiniProgram templates.

Core Markdown structures can be rendered with native MiniProgram components and do not require WebView or DOM. Unknown or complex HTML is returned as an `html` block; consumers may render that block with `rich-text` as a fallback.

## Usage

```sh
npm install @cherry-markdown/miniprogram
```

The package is ESM-only and exposes `CherryStream`, which creates and owns its Cherry engine. Its `setMarkdown()` input model matches Web CherryStream; it returns MiniProgram view data instead of updating a DOM previewer. SSE requests, framing, and payload extraction are application responsibilities.

The native MiniProgram runtime does not execute ESM packages directly. Bundle application source that imports this package into the MiniProgram runtime format; the Demo uses Rollup for that build step.

### Stream rendering

```js
import CherryStream from '@cherry-markdown/miniprogram';

const page = this;
const cherry = new CherryStream();
let markdownContent = '';
function render(streaming) {
  page.setData({
    blocks: cherry.setMarkdown(markdownContent, { deferImages: !streaming }),
    streaming,
  });
}

function finishStream() {
  render(false);
}

// Your SSE client extracts Markdown strings from the transport.
function onMarkdownChunk(chunk) {
  markdownContent += chunk;
  render(true);
}

function onStreamComplete() {
  finishStream();
}
```

Pass the complete accumulated Markdown to `setMarkdown()`, matching Web `CherryStream.setMarkdown()`. It re-renders the current complete content, which preserves valid rendering for incomplete syntax. The package does not implement SSE requests, decoding, framing, or provider payload extraction.

`setMarkdown()` re-renders the accumulated Markdown for correctness with incomplete syntax. While a stream is active, pass `deferImages: true` to render image placeholders; call it once with `deferImages: false` when the stream completes. For high-frequency model output, batch page-level `setData` calls (for example, every 50-100 ms) instead of updating for every chunk.

## Module Formats

| Entry                          | ESM                       |
| ------------------------------ | ------------------------- |
| `@cherry-markdown/miniprogram` | `dist/miniProgram.esm.js` |

## Supported Features

| Feature       | Syntax                          | Render                                                         | Status |
| ------------- | ------------------------------- | -------------------------------------------------------------- | ------ |
| Paragraph     | plain text                      | Native `view` + `text` runs                                    | ✅     |
| Heading       | `#` `##` `###`                  | Native `view` with level class                                 | ✅     |
| Blockquote    | `>`                             | Native child-block data                                        | ✅     |
| List          | `-` / `1.`                      | Flexbox + marker text                                          | ✅     |
| Task List     | `- [x]` / `- [ ]`               | Flexbox, `☑`/`☐` markers                                       | ✅     |
| Table         | `\| A \| B \|`                  | Native table rows and cell runs                                | ✅     |
| Code Block    | ` ```lang ``` `                 | Highlight runs; template adds copy                             | ✅     |
| Image         | `![alt](src)`                   | Placeholder while streaming; native image run after completion | ✅     |
| Link          | `[text](url)`                   | Text run with `href`; template binds tap                       | ✅     |
| Math Inline   | `$E=mc^2$`                      | Formula source in a text run                                   | ✅     |
| Math Block    | `$$...$$`                       | Formula source block, not typeset                              | ✅     |
| Mermaid       | ` ```mermaid ``` `              | Mermaid source block, not a diagram                            | ✅     |
| Bold          | `**text**`                      | `class="md-strong"`                                            | ✅     |
| Italic        | `*text*`                        | `class="md-em"`                                                | ✅     |
| Inline Code   | `` `code` ``                    | `class="md-inline-code"`                                       | ✅     |
| Underline     | `++text++`                      | `class="md-underline"`                                         | ✅     |
| Strikethrough | `~~text~~`                      | `class="md-strike"`                                            | ✅     |
| Sub / Sup     | `~text~` / `^text^`             | Inline text with class                                         | ✅     |
| Line Break    | two trailing spaces             | `\n` in text run                                               | ✅     |
| AutoLink      | `https://...`                   | Same as link                                                   | ✅     |
| Emoji         | `:smile:`                       | Image component                                                | ✅     |
| Cursor        | stream only                     | `\|` cursor symbol                                             | ✅     |
| Footnote ref  | `[^key]`                        | Sup/link data; template owns navigation                        | ✅     |
| Panel         | `:::tip/warning/danger/success` | Plain paragraph, styling lost                                  | ❌     |
| Footnote body | generated content               | Plain paragraphs, styling lost                                 | ❌     |
| Color / Size  | `==color=red text==`            | Attr preserved, WXML ignores                                   | ❌     |
| Align         | `:::left/center/right`          | CSS class not consumed                                         | ❌     |
| Toc           | `[TOC]`                         | List structure ok, styling lost                                | ❌     |
| Hr            | `---`                           | Rich-text fallback                                             | ❌     |
| Detail        | `+++`                           | Rich-text fallback, static                                     | ❌     |
| Ruby          | `{ Ruby }`                      | Rich-text fallback                                             | ❌     |
| Raw HTML      | `<div>...</div>`                | Rich-text fallback                                             | ❌     |
| SuggestList   | editor only                     | Not rendering                                                  | —      |
| FrontMatter   | `---yaml---`                    | Not rendered by default                                        | —      |

The package returns WXML-friendly data only. The bundled Demo shows one template implementation for common blocks, code copy, image preview, link handling, and `html` fallback; applications must provide their own template, styles, and event handlers.

## Demo

A complete WeChat MiniProgram demo is available at `examples/miniProgram`. Install its dependencies and run `yarn --cwd examples/miniProgram build` before opening `examples/miniProgram` in WeChat DevTools. See the [Demo README](../../examples/miniProgram/README.md) for local-package and preview-tarball verification.

## License

Apache-2.0. See [LICENSE](./LICENSE).
