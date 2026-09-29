# @cherry-markdown/milkdown

An out-of-the-box Milkdown/ProseMirror WYSIWYG Markdown editor that reuses Cherry Markdown parsing, rendered HTML, and visual styles. It does not create a Cherry editor or Previewer and is independent from Cherry's editor modes.

## Minimal React setup

```tsx
import { useEffect, useRef } from 'react';
import { cherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

export function Editor() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let instance: Awaited<ReturnType<typeof cherryMilkdown>> | undefined;
    void cherryMilkdown({
      root: root.current!,
      value: '# Hello',
      onChange: ({ markdown }) => console.log(markdown),
    }).then((editor) => {
      if (disposed) return editor.destroy();
      instance = editor;
    });
    return () => {
      disposed = true;
      void instance?.destroy();
    };
  }, []);
  return <div ref={root} />;
}
```

The package creates a default `CherryEngine`. Pass `engine` only when reusing custom Cherry Engine hooks or rendering configuration.

## API

- `cherryMilkdown(options)` creates an independent editor.
- `getMarkdown()` reads Markdown.
- `setMarkdown(markdown, { emit? })` updates Markdown and emits by default.
- `setTheme(theme)` switches the Cherry theme without changing Markdown or history.
- `focus()` focuses the editor.
- `destroy()` releases the editor, overlays, NodeViews, and renderer resources.
- `bubble` enables the selection Bubble (default `true`), initially with bold, italic, underline, and strikethrough.
- `readonly` creates a read-only surface.
- `theme` selects a Cherry theme and defaults to `default`; `dark`, `abyss`, `green`, `red`, `gray`, `violet`, and `blue` are supported.
- `plugins` adds Milkdown plugins.
- `renderers` registers optional renderers by fenced-code language. Matching fences automatically gain source expansion and live updates; `tableChart` is reserved for table-chart previews.
- `fileUpload` optionally uploads a selected image. The returned URL and image attributes are written only after the user confirms Save.

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
await cherryMilkdown({ root: '#markdown', value: markdown, renderers: { echarts, tableChart } });
```

A custom renderer does not require a Milkdown schema change. This renderer matches fences whose language is `custom-chart` and redraws only the affected node after its expanded source changes:

````ts
await cherryMilkdown({
  root: '#markdown',
  value: '```custom-chart\n{"value": 1}\n```',
  renderers: {
    'custom-chart': ({ container, source }) => {
      container.textContent = source;
    },
  },
});
````

```ts
await cherryMilkdown({
  root: '#markdown',
  value: markdown,
  fileUpload(file, done, { signal }) {
    upload(file, { signal }).then(({ url }) => done(url, { name: file.name, width: '100%' }));
  },
});
```

## Boundaries

- Markdown is the only persistent data format.
- CommonMark/GFM content is structurally edited by Milkdown.
- Cherry-specific syntax prefers HTML produced by CherryEngine. Safely editable nodes expose live source or property controls; unknown syntax preserves source instead of being rewritten incorrectly.
- Selection, link, and image UI belongs to this package and does not call Cherry editor internals.
- The stylesheet imports Cherry's published CSS and scopes editing-only additions under `.cherry-milkdown` to reduce upgrade coupling.
- `mathlive`, `mermaid`, and `echarts` are capability peers. Install the matching dependency when enabling formulas, Mermaid, or ECharts; runtime renderer failures stay isolated to the affected node and report through `onError` without blocking ordinary Markdown.
- ECharts configuration accepts JSON5 data only and never executes JavaScript. Maps still require consumer-provided map data or a custom renderer.
- Standalone table charts keep Milkdown's native GFM table as their editable source of truth; a package-owned derived preview hot-updates from its cells. Cherry-owned compound blocks such as Columns and Tabs remain whole-block renders and whole-block source editors; this package never injects child controls or chart mount points into Cherry-generated DOM.
- Generic drag handles cover top-level paragraphs and blockquotes only. Headings keep Cherry's native anchor interaction; lists and compound Cherry nodes retain selection/cut/paste semantics so their internal controls are not intercepted.

Run the demo with `yarn workspace @cherry-markdown/milkdown dev:demo`.
