# @cherry-markdown/milkdown

[简体中文](./README.CN.md)

A framework-neutral Milkdown WYSIWYG editor for Cherry Markdown. The editor surface is the content view; a separate preview pane is not required.

## Features

- Native editable Milkdown nodes for CommonMark and GFM.
- Direct editing for tables, task lists, links, images, quotes, and code blocks.
- Inline and block formulas edited in place with MathLive and serialized as Cherry LaTeX.
- Editable marks for Cherry colors, backgrounds, font size, subscript, superscript, ruby, underline, and highlight.
- Editable compound nodes for panels, details, columns, tabs, and timelines.
- A live TOC plus in-place forms for frontmatter and reference definitions.
- Mermaid renders by default. PlantUML and ECharts can use application renderers, with configuration edited beside the live diagram.
- HTML uses a script-disabled sandbox preview with an adjacent source inspector when selected.

Cherry extensions are not presented as raw source cards. Business-specific syntax must provide a Milkdown schema, parser, serializer, and NodeView through a plugin; unregistered syntax is not claimed as supported.

## Install

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown mathlive mermaid
```

Import the styles once:

```js
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
```

## Usage

```js
import { createCherryMilkdown } from '@cherry-markdown/milkdown';

const editor = await createCherryMilkdown({
  root: document.querySelector('#editor'),
  value: '# Title\n\nInline math $E=mc^2$ and !!red colored text!!.',
  onChange({ markdown }) {
    console.log(markdown);
  },
});

editor.setMarkdown('# Updated');
console.log(editor.getMarkdown());
await editor.destroy();
```

Plugins passed through `plugins` are loaded after the built-in WYSIWYG plugins and can register business NodeViews.

The editor includes selection/block controls and a `/` menu. Tables use Milkdown's `table-block` controls for row and column insertion, deletion, dragging, and alignment. Selecting a formula activates MathLive in place.

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
