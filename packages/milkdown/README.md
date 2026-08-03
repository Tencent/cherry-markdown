# @cherry-markdown/milkdown

> [!WARNING]
>
> This package is in early development. It currently imports CherryEngine from a private `cherry-markdown/dist` path, so keep both packages on compatible versions.

[简体中文](./README.CN.md)

Framework-neutral Milkdown editing with Cherry Markdown rendering. CommonMark and GFM use Milkdown's native document model. Cherry-only syntax is preserved as raw atomic nodes and rendered by CherryEngine.

## Install

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown
```

Import the base styles once:

```js
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
```

## Usage

```js
import { createCherryMilkdown } from '@cherry-markdown/milkdown';

const editor = await createCherryMilkdown({
  root: document.querySelector('#editor'),
  previewRoot: document.querySelector('#preview'),
  value: '# Hello\n\n[[toc]]',
  onChange({ markdown, html }) {
    console.log(markdown, html);
  },
});

editor.setMarkdown('# Updated');
console.log(editor.getMarkdown());

// Later:
await editor.destroy();
```

`previewRoot` is optional. Without it, CherryEngine still renders the HTML passed to `onChange`, while the package behaves as a standalone Milkdown editor.

Double-click a Cherry raw node to edit its original Markdown. Built-in raw preservation covers frontmatter, math, TOC, comment references, panels, details, Cherry inline formatting, raw HTML, and Mermaid/PlantUML/ECharts code blocks.

## Custom syntax

Register business-specific syntax explicitly:

```js
await createCherryMilkdown({
  root,
  rawPatterns: [{ name: 'mention', kind: 'inline', pattern: /@\[[^\]]+\]/ }],
});
```

The package does not inspect private Cherry hooks. Unregistered custom syntax may be normalized by Milkdown.

Run `yarn build && npx vite examples` in this package to open the minimal Vanilla example.

## License

Apache-2.0. See [LICENSE](./LICENSE).
