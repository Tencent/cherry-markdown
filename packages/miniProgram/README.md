# @cherry-markdown/miniprogram

> Early development. Validate native components and the Skyline example on your target base library and devices before production use.

[简体中文](./README.CN.md)

Cherry Markdown view data and maintained native WeChat MiniProgram components. Paragraphs, headings, nested lists, quotes, tables, code and images use WXML `view`, `text`, `image` and `scroll-view`. Neither `web-view` nor `rich-text` is used.

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

Transforms, view mapping, scheduling and native components use strict TypeScript with declarations emitted from source. `shared/engine.js` remains an integration boundary to the existing Cherry JS engine. The Web editor is unchanged.

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
- Web parity for colors, font sizes, panels, TOC, footnote navigation and collapsible details is not promised.
- Code highlighting uses Prism tokens directly. Panels/details preserve semantic metadata and render as static native groups; mark/underline render natively and ruby annotations as additional text. TOC/footnotes preserve links; apps own navigation.

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

## License

Apache-2.0. See [LICENSE](./LICENSE).

### Shared-core boundary

The build currently imports Cherry source from this monorepo; semantic nodes and incremental state still live in this package rather than a stable public cross-package entry. Precompiled native components bundle the engine. Updating only the application's `cherry-markdown` dependency cannot replace that bundled engine: rebuild the components or upgrade a coordinated MiniProgram release. Shared syntax does not imply equivalent layout, theming, or advanced rendering features.
