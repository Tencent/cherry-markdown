# @cherry-markdown/milkdown

A previewOnly WYSIWYG plugin for Cherry. Milkdown owns the preview document,
selection and history, while the current Cherry instance provides parsing,
themes and native preview controls. The plugin creates no second Cherry and adds
no top toolbar or source suggestion UI.

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
  onChange({ cherry, instanceId, markdown }) { console.log(markdown); },
});

const cherry = new Cherry({
  el: document.getElementById('editor')!,
  value: '# Heading',
  isPreviewOnly: true,
});

await cherry.whenPluginsReady();
const editor = cherry.getPlugin(MilkdownPlugin);
```

Register once before constructing Cherry. Every subsequent previewOnly Cherry
gets an isolated Milkdown runtime, and cherry.destroy() cleans it automatically.
editOnly, edit&preview and CherryStream are intentionally not claimed yet.

Plugin options: readonly, bubble (default true), debounce (30ms), renderers,
mathlive, native Milkdown plugins, onChange and onError.
Changes update the document immediately; debounce applies only to notifications.
Destroy removes only the subtree owned by this instance.

The selection Bubble operates directly on ProseMirror marks. Code blocks, atomic
nodes, formula fields and embedded source selections do not qualify. Images and
Mermaid expose width/alignment controls independently of the text Bubble.

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

The consumer build installs packed Cherry and Milkdown artifacts from this
change. This migration is not a claim of full production
parity: advanced chart settings, full visual parity and image drag-resizing still
need acceptance. See [architecture and acceptance boundaries](./ARCHITECTURE.md).
