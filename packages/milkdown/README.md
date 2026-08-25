# @cherry-markdown/milkdown

[简体中文](./README.CN.md)

A Milkdown WYSIWYG extension for Cherry Markdown. The recommended mode mounts Milkdown in the existing Cherry previewer: Cherry keeps ownership of the page, theme, toolbar, layout, and preview interactions while Milkdown makes that content directly editable.

## Features

- Native editable Milkdown nodes for CommonMark and GFM.
- Direct editing for tables, task lists, links, images, quotes, and code blocks.
- Inline and block formulas edited in place with MathLive and serialized as Cherry LaTeX.
- Editable marks for Cherry colors, backgrounds, font size, subscript, superscript, ruby, underline, and highlight.
- Panels, details, columns, tabs, and timelines keep their body in the continuous editor flow; titles are edited directly in place.
- A live TOC plus compact document metadata and reference nodes with no field forms or modal dialogs.
- Mermaid renders by default. PlantUML and ECharts can use application renderers; source opens inside the selected node only when requested.
- HTML uses a script-disabled sandbox preview and an opt-in inline source mode.

Cherry extensions are not presented as raw source cards. Business-specific syntax must provide a Milkdown schema, parser, serializer, and NodeView through a plugin; unregistered syntax is not claimed as supported.

## Install

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown mathlive mermaid
```

Import Cherry's original styles and the Milkdown editing behavior styles:

```js
import 'cherry-markdown/dist/cherry-markdown.css';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
```

## Usage

```js
import Cherry from 'cherry-markdown';
import { attachCherryMilkdownPreview } from '@cherry-markdown/milkdown';

const cherry = new Cherry({
  id: 'editor',
  value: '# Title\n\nInline math $E=mc^2$ and !!red colored text!!.',
  editor: { defaultModel: 'previewOnly' },
});

const editor = await attachCherryMilkdownPreview(cherry, {
  onChange({ markdown }) {
    console.log(markdown);
  },
});

// Preview edits are written to Cherry's Markdown/CodeMirror automatically.
// Source edits are synchronized back into the current Milkdown preview.
await editor.detach(); // Restore Cherry's native read-only preview.
```

`createCherryMilkdown` remains available for a standalone surface without Cherry's page shell, but it is not the default integration demonstrated here.

Plugins passed through `plugins` are loaded after the built-in WYSIWYG plugins and can register business NodeViews.

The editor intentionally has no permanent formatting toolbar. Type `/` on an empty block for insertion commands, use native Markdown shortcuts for formatting, and edit compound titles and bodies directly. Structural controls appear only while hovering or selecting their node. Tables use Milkdown's `table-block` controls for row and column insertion, deletion, dragging, and alignment. Selecting a formula activates MathLive in place.

Configure MathLive macros and its virtual keyboard through `mathlive`:

```js
createCherryMilkdown({
  root,
  mathlive: {
    macros: { RR: '\\mathbb{R}' },
    virtualKeyboardMode: 'onfocus',
  },
});
```

Use `renderers` to render special diagram formats asynchronously. A renderer may return an HTML string, a cleanup function, or write directly to `container`:

```js
createCherryMilkdown({
  root,
  renderers: {
    echarts: async ({ container, source }) => {
      const chart = createECharts(container, source);
      return () => chart.dispose();
    },
  },
});
```

## Local example

```sh
yarn build
npx vite examples
```

## Current boundary

CherryEngine is still loaded from the private `cherry-markdown/dist/cherry-markdown.engine.core.esm.js` path for compatibility. Diagrams remain visual embedded objects, arbitrary HTML is not exposed as editable ProseMirror content for security, and business-specific hooks require an explicit Milkdown plugin.

## License

Apache-2.0. See [LICENSE](./LICENSE).
