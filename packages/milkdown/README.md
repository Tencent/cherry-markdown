# @cherry-markdown/milkdown

[简体中文](./README.CN.md)

A framework-neutral Milkdown WYSIWYG editor for Cherry Markdown. The editor surface is the content view; a separate preview pane is not required.

## Features

- Native editable Milkdown nodes for CommonMark and GFM.
- Direct editing for tables, task lists, links, images, quotes, and code blocks.
- Inline and block math rendered with KaTeX.
- Editable marks for Cherry colors, backgrounds, font size, subscript, superscript, ruby, underline, and highlight.
- Visual nodes for TOC, frontmatter, panels, details, HTML, comment references, and special diagram fences.
- Mermaid renders as a diagram by default. PlantUML and ECharts can use application renderers. Embedded objects expose source configuration only while editing the object.

Cherry extensions are not presented as raw source cards. Business-specific syntax must provide a Milkdown schema, parser, serializer, and NodeView through a plugin; unregistered syntax is not claimed as supported.

## Install

```sh
npm install @cherry-markdown/milkdown @milkdown/kit @milkdown/plugin-math cherry-markdown katex mermaid
```

Import the styles once:

```js
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
import 'katex/dist/katex.min.css';
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

CherryEngine is still loaded from the private `cherry-markdown/dist/cherry-markdown.engine.core.esm.js` path to render embedded objects. Complex diagrams are visual atomic nodes: Mermaid rendering is built in, while PlantUML and ECharts require `renderers`. Regular text and inline formatting remain directly editable.

## License

Apache-2.0. See [LICENSE](./LICENSE).
