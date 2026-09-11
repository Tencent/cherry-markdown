# @cherry-markdown/milkdown

A standalone Cherry-style WYSIWYG editor. Milkdown owns the document, selection,
and undo history. The released CherryEngine renders extension syntax; Cherry CSS
provides native themes. No Cherry editor, CodeMirror, top toolbar, or source
suggestion UI is instantiated.

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown mathlive
# Optional diagrams
npm install mermaid echarts
```

```ts
import { cherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

const editor = await cherryMilkdown({
  el: document.getElementById('editor')!,
  value: '# Heading',
  onChange({ markdown }) { console.log(markdown); },
});
editor.getMarkdown();
editor.setMarkdown('# Updated');
await editor.destroy();
```

There is one instance and one lifecycle. React consumers create in an effect and
destroy on cleanup, including instances whose asynchronous creation finishes
after unmount. See the single React example in examples/react/App.tsx.
The unpublished attach/usePlugin/mode bridge APIs have been removed.

Options: el, value, readonly, theme, bubble (default true), debounce (30ms),
cherryOptions (engine options only), engine (optional makeHtml provider), renderers,
mathlive, plugins (Milkdown plugins), onChange and onError.
Changes update the document immediately; debounce applies only to notifications.
Destroy removes only the subtree owned by this instance.

The selection Bubble operates directly on ProseMirror marks. Code blocks, atomic
nodes, formula fields and embedded source selections do not qualify. Images and
Mermaid expose width/alignment controls independently of the text Bubble.

Optional chart renderers:

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
const editor = await cherryMilkdown({ el, value, renderers: { echarts, tableChart } });
```

The public ECharts code renderer accepts JSON/JSON5 data, never executable JavaScript. Without a
renderer the native table/source remains available. Map charts require a
consumer-owned geographic data provider and renderer.

From the repository root:

```sh
yarn workspace @cherry-markdown/milkdown build:demo
yarn workspace @cherry-markdown/milkdown dev:demo --host 127.0.0.1 --port 4201
yarn workspace @cherry-markdown/milkdown typecheck
yarn workspace @cherry-markdown/milkdown test
yarn workspace @cherry-markdown/milkdown test:e2e
yarn workspace @cherry-markdown/milkdown test:consumer
```

The consumer build installs released cherry-markdown@0.11.10 rather than repacking
the workspace's Cherry build. This migration is not a claim of full production
parity: advanced chart settings, full visual parity and image drag-resizing still
need acceptance. See [architecture and acceptance boundaries](./ARCHITECTURE.md).
