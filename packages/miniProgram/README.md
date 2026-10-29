# @cherry-markdown/miniprogram

> Early development. Validate native components and the Skyline example on your target base library and devices before production use.

[简体中文](./README.CN.md)

Cherry Markdown view data and maintained native WeChat MiniProgram components. Paragraphs, headings, nested lists, quotes, tables, code and images use WXML `view`, `text`, `image` and `scroll-view`. Neither `web-view` nor `rich-text` is used.

Mobile styling is checked against the real Web and Skyline renderers using one Markdown fixture. See the repository's [390px comparison and remaining differences](../../examples/miniProgram/compare/README.md). Default/dark simulator checks do not establish pixel equality across all themes, widths or devices.

## Native component

```sh
npm install @cherry-markdown/miniprogram
```

Copy the installed package's entire `dist/components` directory into your MiniProgram at `components/cherry`. Keep all three subdirectories together. Runtime scripts are already bundled as CommonJS; no npm build or ESM parser import in your page is required.

Page JSON:

```json
{
  "usingComponents": {
    "cherry-markdown": "/components/cherry/markdown/index"
  }
}
```

Page WXML:

```xml
<cherry-markdown id="markdown" update-interval="80" bind:linktap="onLinkTap" />
```

For high-frequency streaming, get the component handle in the page's `onReady` and call its logic-layer method. This avoids repeatedly passing complete Markdown through page `setData`:

```ts
import type { NativeMarkdownHandle } from '@cherry-markdown/miniprogram';

const renderer = this.selectComponent('#markdown') as NativeMarkdownHandle;
renderer.setMarkdown(accumulatedMarkdown, true);
renderer.setMarkdown(finalMarkdown, false);
```

Applications own requests, SSE decoding and framing. Pass the complete accumulated string. Static or infrequent content can instead bind the `markdown` and `streaming` properties; choose one input method per component. Handle `event.detail.href` from `linktap` in your app. The component never opens a web page. Code copy and image preview are built in.

Updates are coalesced over 80 ms by default. Only one `setData` commit is in flight; its acknowledgement schedules the latest pending input. Completion flushes immediately when possible and replaces image placeholders with native images. Detachment cancels pending work. `update-interval` is read on attachment.

Consecutive inline text runs share one native text host for wrapping and selection. Images are separate blocks; browser-style inline image layout is not promised.

Tables are measured as native flow content before assigning an explicit horizontal scroll-view height. Added rows, image loads and page resizing trigger measurement while preserving horizontal offset; stale/unmounted measurements and duplicate image-load notifications are ignored.

Every component loop has sibling-unique IDs. Top-level blocks retain reconciled identity; nested rows, cells and runs use positional IDs within that block for tail appends, rather than arbitrary nested reordering. Public semantic nodes do not include these component-only IDs.

## TypeScript and data-only integration

The public semantic protocol, incremental parser, view mapping, scheduler and native components use strict TypeScript. The adapter imports only the public bridge; the core owns its typed boundary to the existing JavaScript engine.

```ts
import CherryStream, { NativeMarkdownController } from '@cherry-markdown/miniprogram';
import type { MiniProgramViewBlock } from '@cherry-markdown/miniprogram';

const blocks: MiniProgramViewBlock[] = new CherryStream().setMarkdown('**hello**', { deferImages: false });
const controller = new NativeMarkdownController((patch, done) => page.setData(patch, done));
controller.setMarkdown(accumulatedMarkdown, true);
controller.setMarkdown(finalMarkdown, false);
// Call controller.dispose() on page destruction.
```

The data-only entry is ESM and must be bundled by custom consumers. The default component already includes its parser; do not also bundle it into the page.

## Capabilities and migration

- Native paragraphs, headings, quotes, nested/task lists, tables, code, links, images and thematic breaks.
- List items contain recursive `children: MiniProgramViewBlock[]`, preserving nested block structure.
- Math and Mermaid preserve semantic nodes and source, displayed as copyable native text. Mathematical typesetting and diagram drawing are not implemented.
- Unsupported block HTML becomes `{ type: 'unsupported', tag, text }`. `unknownTag: 'unwrap'` retains supported descendants; `'drop'` discards the block. Scripts, styles and event attributes do not become native interactions.
- Cherry color/background/font-size semantics map to a safe native text-style subset; arbitrary HTML/CSS does not run browser layout.
- Code highlighting uses Prism tokens directly. Panels have native titles and content; Detail uses a native expand/collapse button and retains user state through body updates; mark/underline render natively and ruby annotations as additional text. TOC/footnotes preserve links; apps own navigation.

Migrating from 0.0.2: replace list item `inlines` with recursive `children`, `html` blocks with `unsupported` text, and `unknownTag: 'html'` with `'text'`. Existing Markdown input methods remain available. Using the default component avoids maintaining custom templates.

## Direct semantics, incremental parsing and Skyline

The native pipeline is `Markdown → existing Cherry hooks → semantic nodes → native view`. Built-in recognition rules, hook order, escaping and streaming auto-closure are shared with Web. Hooks emit semantic references that build nodes directly, rather than serializing generated Markdown HTML and parsing it back. Code highlighting uses `Prism.tokenize`. Only explicit source HTML is parsed as HTML, and still becomes native data.

Append-only input reuses confirmed top-level semantic blocks and reparses two trailing blocks plus their separator. Checkpoints come from actual Cherry parse results and line metadata. Both candidate fragments are reparsed and checked before a boundary is trusted. Existing FrontMatter/Panel/Detail opener rules prevent checkpoints inside unclosed structures.

Edits, clearing, transform-option changes, actual reference definitions, footnotes, TOC and source HTML invalidate reuse. Dependencies are reported by the actual hooks, so literal lookalikes in code do not trigger invalidation. Multiline whitespace emphasis, callbacks and custom hooks conservatively use full parsing. `{ incremental: false }` disables reuse for comparison.

`stream.getParseStats()` reports `mode` (`full`, `incremental`, `unchanged`), `parsedCharacters` (normalized string units processed by the grammar, including boundary verification) and `reusedCharacters`. Identical Markdown avoids re-parsing while image/style view options can still update.

Unchanged blocks still retain identity for differential native commits. Input comparison, view mapping and comparison still cost work. A growing single block still needs active-block parsing; global dependencies may require full parsing. This is not constant-time rendering or list virtualization.

HTML-only third-party renderers must adapt to `this.$engine.semanticRenderer.wrap/atom` and report global dependencies using `invalidateDocument`. They do not silently fall back to an HTML intermediate. The Web backend keeps its original HTML output. `makeHtml()` remains an explicit compatibility API; native `setMarkdown`, `makeView` and `makeBlocks` use direct semantics. Public `makeBlocks()` returns detached copies of cached nodes.

The Demo includes ordinary and Skyline pages sharing the same components. The Skyline page explicitly configures its renderer, glass-easel, custom navigation and scroll container, with no web content fallback. Confirm the actual engine in WeChat DevTools and test on target iOS/Android devices: mixed text/selection, nested lists, wide tables, code copy, image transitions, stream completion/reset/detachment, scroll position, parse time, payload size, layout frames and memory.

Local TS, semantic, scheduling, package and WXML checks do not establish Skyline device performance.

## Demo

From the repository root:

```sh
vp run -F @cherry-markdown/miniprogram build
vp run -F @cherry-markdown/mini-program-demo build
```

Open `examples/miniProgram` in WeChat DevTools. See the [Demo README](../../examples/miniProgram/README.md) for package verification.

Native tables size columns from native text metrics and Web Sass cell constraints. Code-block spacing follows the parent font line box. A single small offscreen context only measures text; the document stays in native WXML. Streaming updates keep the scroll node and valid horizontal offset mounted while row heights and column widths change. See the mobile comparison record for device and interaction acceptance limits.

## License

Apache-2.0. See [LICENSE](./LICENSE).

### Public bridge, releases and themes

Semantic nodes and incremental state now live in `cherry-markdown/semantic`, with schema version 1. The adapter consumes that public artifact; `dist/semantic-bridge.json` records the core/schema bundled into native components. ESM remains linked to the declared core dependency, while precompiled components bundle it.

The exact core dependency causes Changesets to bump the adapter and update its dependency for every core patch, minor or major release. Publishing waits for the paired core job. Applications still need to rebuild/publish; changing only a root dependency cannot replace precompiled component code. Advanced callers can pass `{ bridge: new CherrySemanticParser() }` using a compatible schema and should unify dependencies in their own build.

Use `theme="dark"` on the native component to select a theme. The eight Cherry themes are compiled from the existing Sass via the lightweight `cherry-markdown/theme` entry. Native colors/backgrounds/font sizes, Panel titles and Detail expand/collapse are supported; math, Mermaid and chart-table graphics still retain source or table content. Arbitrary HTML/CSS and HTML-only renderers do not execute browser layout. Shared tokens do not promise pixel-identical rendering.
