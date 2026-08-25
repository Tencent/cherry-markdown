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
import { milkdown } from '@cherry-markdown/milkdown';

const cherry = new Cherry({
  id: 'editor',
  value: '# Title\n\nInline math $E=mc^2$ and !!red colored text!!.',
  extensions: [
    milkdown({
      onChange({ markdown }) {
        console.log(markdown);
      },
    }),
  ],
});

// Preview edits are written to Cherry's Markdown/CodeMirror automatically.
// Source edits are synchronized back into the current Milkdown preview.
cherry.destroy(); // Milkdown is cleaned up with this Cherry instance.
```

`attachCherryMilkdownPreview(cherry, options)` remains available for existing integrations that need an explicit detach handle. `createCherryMilkdown` remains available for a standalone surface without Cherry's page shell. Neither is the recommended Cherry integration.

Plugins passed through `plugins` are loaded after the built-in WYSIWYG plugins and can register business NodeViews.

In extension mode the original Cherry toolbar remains in place and routes formatting to the currently focused preview selection. Pickers such as image, file, Draw.io, and chart keep Cherry's original UI and insert at the saved Milkdown selection. Type `/` on an empty preview block for insertion commands, or use native Markdown shortcuts. Structural controls appear only while hovering or selecting their node. Tables use Milkdown's `table-block` controls for row and column insertion, deletion, dragging, and alignment. Selecting a formula activates MathLive in place.

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
yarn build:demo
npx serve preview
```

The demo reuses Cherry's root `examples/index.html` layout, configuration, toolbar, theme, ECharts plugin, and full Markdown manual. Its only integration difference is `extensions: [milkdown()]`.

## Current boundary

CherryEngine is still loaded from the private `cherry-markdown/dist/cherry-markdown.engine.core.esm.js` path for compatibility. Diagrams remain visual embedded objects, arbitrary HTML is not exposed as editable ProseMirror content for security, and business-specific hooks require an explicit Milkdown plugin.

## License

Apache-2.0. See [LICENSE](./LICENSE).
