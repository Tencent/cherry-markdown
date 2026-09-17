# @cherry-markdown/milkdown

A WYSIWYG preview plugin for Cherry's edit&preview and previewOnly modes. Milkdown owns the preview document,
selection and history, while the current Cherry instance provides parsing,
themes and native preview controls. The plugin creates no second Cherry and adds
no replacement top toolbar or source suggestion UI.

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown mathlive
# Optional diagrams
npm install mermaid echarts
```

```ts
import Cherry from 'cherry-markdown';
import { MilkdownPlugin } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

Cherry.usePlugin(MilkdownPlugin, {
  onChange({ cherry, instanceId, markdown }) {
    console.log(markdown);
  },
});

const cherry = new Cherry({
  el: document.getElementById('editor')!,
  value: '# Heading',
  isPreviewOnly: true,
});

await cherry.whenPluginsReady();
const editor = cherry.getPlugin(MilkdownPlugin);
```

Register once before constructing Cherry. Every subsequent edit&preview or previewOnly Cherry
gets an isolated Milkdown runtime, and cherry.destroy() cleans it automatically.
editOnly and CherryStream are intentionally not activated.
Use `configure({ cherry, instanceId, mode })` to return per-instance overrides
when one page mixes editable and readonly previews; static registration remains
site-wide.

Plugin options: readonly, bubble (default true), debounce (30ms), renderers,
mathlive, native Milkdown plugins, configure, onChange and onError.
Changes update the document immediately; debounce applies only to notifications.
Destroy removes only the subtree owned by this instance.

The native Cherry Bubble follows explicit focus ownership: source selections keep
Cherry's CodeMirror behavior, while preview selections operate on ProseMirror and
synchronize Markdown back to the source pane. Code blocks, atomic
nodes, formula fields and embedded source selections do not qualify. Images and
Links keep Cherry's normal click behavior. Hover or focus a link to reveal one shared trailing edit trigger for its visible text and href; it avoids following prose automatically and also opens with `Command/Ctrl + K`.
Nested table charts select their rendered table source instead of a neighboring fenced example.
Mermaid exposes width/alignment controls independently of the text Bubble; those controls are suspended while its source editor owns focus.

Optional chart renderers:

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
Cherry.usePlugin(MilkdownPlugin, { renderers: { echarts, tableChart } });
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

The single React demo defaults to previewOnly and accepts
`?mode=edit%26preview` or `?mode=editOnly` to exercise Cherry's standard modes.
The consumer build installs packed Cherry and Milkdown artifacts from this
change. This migration is not a claim of full production
parity: advanced chart settings, full visual parity and image drag-resizing still
need acceptance. See [architecture and acceptance boundaries](./ARCHITECTURE.md).
